import type { Lesson } from "@/content/types";

export const threadsLesson: Lesson = {
  id: "cpp-threads",
  slug: "threads-joining-detaching-and-jthread",
  moduleSlug: "concurrency",
  title: "Threads, Joining, Detaching & jthread's Automatic Join",
  summary:
    "Starting work on another core, and the one rule that makes `std::thread` a trap: forgetting to join calls `std::terminate`. Why that design was chosen, what `detach` really costs, and how C++20's `jthread` makes the whole problem go away.",
  estimatedMinutes: 35,
  objectives: [
    "Start a thread and pass arguments to it correctly",
    "Explain why a joinable `std::thread` destructor calls `terminate`",
    "Say why `detach` is almost always wrong",
    "Use `std::jthread` and its automatic join",
    "Request cooperative cancellation with `stop_token`",
  ],
  sections: [
    {
      id: "starting",
      heading: "Starting a thread",
      body: [
        "**A `std::thread` starts running the moment it is constructed.** There is no separate `start()` — construction launches it, and the constructor's arguments after the callable are forwarded to it.",
        "**Arguments are copied into the thread's own storage by default**, which is a safety feature and a common surprise. To pass a reference you must wrap it in `std::ref`, and doing so makes you responsible for the referent outliving the thread.",
        "**`std::thread::hardware_concurrency()`** reports the number of hardware threads, or 0 if the implementation cannot tell. It is a hint for sizing a pool, not a guarantee.",
        "**Threads are move-only.** A `std::thread` object is a *handle* to an OS thread, and two handles to one thread would be meaningless, so copying is deleted and `std::move` transfers ownership — leaving the source not joinable.",
        "**`joinable()` is true from construction until you `join()` or `detach()`.** A default-constructed thread and a moved-from thread are not joinable.",
      ],
      examples: [
        {
          id: "thread-basics",
          title: "Construction, joining, moving and jthread",
          lang: "cpp",
          code: `#include <chrono>
#include <iostream>
#include <thread>
#include <vector>

using namespace std::chrono_literals;

void worker(int id, int ms) {
    std::this_thread::sleep_for(std::chrono::milliseconds(ms));
    std::cout << "  worker " << id << " done\\n";
}

int main() {
    std::cout << "hardware_concurrency = "
              << std::thread::hardware_concurrency() << '\\n';

    // A thread starts running as soon as it is constructed.
    std::cout << "\\nstarting three threads:\\n";
    std::vector<std::thread> pool;
    for (int i = 0; i < 3; ++i) pool.emplace_back(worker, i, 20 * (3 - i));

    // join() blocks until the thread finishes. EVERY thread must be
    // joined or detached before its std::thread object is destroyed.
    for (auto& t : pool) t.join();
    std::cout << "all joined\\n";

    // joinable() is true from construction until join() or detach().
    std::thread t{worker, 9, 5};
    std::cout << "\\nbefore join, joinable = " << std::boolalpha
              << t.joinable() << '\\n';
    t.join();
    std::cout << "after join,  joinable = " << t.joinable() << '\\n';

    // Threads are move-only: ownership of the OS thread transfers.
    std::thread a{worker, 10, 5};
    std::thread b = std::move(a);
    std::cout << "\\nafter move: a.joinable = " << a.joinable()
              << ", b.joinable = " << b.joinable() << '\\n';
    b.join();

    // jthread (C++20) joins in its destructor -- no leak, no terminate.
    std::cout << "\\njthread joins automatically:\\n";
    {
        std::jthread j{worker, 20, 10};
    }   // join happens HERE
    std::cout << "jthread scope exited\\n";

    // jthread also carries a stop_token for cooperative cancellation.
    std::cout << "\\ncooperative cancellation:\\n";
    {
        std::jthread cancellable{[](std::stop_token st) {
            int n = 0;
            while (!st.stop_requested()) {
                std::this_thread::sleep_for(5ms);
                ++n;
            }
            std::cout << "  stopped after "
                      << (n > 0 ? "some" : "no") << " iterations\\n";
        }};
        std::this_thread::sleep_for(30ms);
        cancellable.request_stop();
    }   // destructor requests stop, then joins
    std::cout << "done\\n";
}`,
          output: `hardware_concurrency = 4

starting three threads:
  worker 2 done
  worker 1 done
  worker 0 done
all joined

before join, joinable = true
  worker 9 done
after join,  joinable = false

after move: a.joinable = false, b.joinable = true
  worker 10 done

jthread joins automatically:
  worker 20 done
jthread scope exited

cooperative cancellation:
  stopped after some iterations
done`,
          explanation:
            "**The three workers finished in reverse order of creation** — worker 2 slept least — which is the first thing to internalise: nothing about thread ordering is guaranteed, and the output order here is a consequence of the sleeps, not the launch order. Note the move leaves `a` not joinable, and the `jthread` block joined at its closing brace with nothing written. **Do not read anything into `std::cout` from several threads being interleaved cleanly here** — that works only because each `<<` chain is a single statement and the sleeps separate them.",
        },
      ],
    },
    {
      id: "the-rule",
      heading: "Join or detach, or the program dies",
      body: [
        "**`~thread()` calls `std::terminate` if the thread is still joinable.** No exception, no warning, no cleanup — the process aborts.",
        "That looks harsh and is deliberate. The alternatives were both worse. **Joining implicitly** would mean a destructor that blocks for an unbounded time, and one that runs during stack unwinding could hang a program that was already failing. **Detaching implicitly** would leave a thread running with references to variables that are being destroyed right now, which is a silent use-after-free rather than a loud abort. The committee chose the failure you notice.",
        "The practical consequence is that **every `std::thread` needs a `join()` on every path out of the scope, including exceptional ones** — which means a `try`/`catch` around anything that can throw between construction and the join, or an RAII wrapper.",
        "**`detach()` severs the handle**: the thread runs to completion on its own and you can never wait for it or know when it finished. It is almost always wrong, because the detached thread usually refers to something in the scope that is about to disappear. At program exit, detached threads are simply killed wherever they happen to be, with no unwinding and no destructors.",
        "**`std::jthread` solves all of this**, and there is essentially no reason to prefer `std::thread` in new code.",
      ],
      examples: [
        {
          id: "terminate",
          title: "What forgetting to join actually does",
          lang: "cpp",
          code: `#include <iostream>
#include <thread>

int main() {
    std::thread t{[]{ std::cout << "  running\\n"; }};
    std::cout << "main exits without joining or detaching\\n";
}   // ~thread() calls std::terminate because t is still joinable`,
          output: `main exits without joining or detaching
terminate called without an active exception
Aborted                          # exit status 134`,
          explanation:
            "**Note that `running` never printed.** The main thread reached the closing brace before the new thread got to its `cout`, the destructor saw a joinable thread and aborted the process immediately. The same signature — abort, exit 134 — as the double free in module 5 and the throwing destructor in module 10. It is loud, which is the point: the alternative designs would have failed silently.",
        },
      ],
      pitfalls: [
        {
          title: "A `std::thread` between construction and `join()` is an exception hazard",
          body: "```\nstd::thread t{work};\ndoSomethingThatMightThrow();   // if this throws...\nt.join();                      // ...this never runs -> terminate\n```\nThe throw unwinds past the `join()`, `~thread()` finds a joinable thread, and the process aborts — turning a recoverable exception into a crash. The fixes are a `try`/`catch` that joins and rethrows, an RAII wrapper class whose destructor joins, or simply `std::jthread`, which is that wrapper already written and standardised.",
        },
      ],
    },
    {
      id: "jthread",
      heading: "`std::jthread` and cooperative cancellation",
      body: [
        "**`std::jthread` is a `std::thread` whose destructor requests a stop and then joins.** Two behaviours, and both matter.",
        "The automatic join makes it exception-safe by construction, in exactly the way `unique_ptr` made `new`/`delete` exception-safe: the cleanup lives in a destructor that runs on every path.",
        "**The stop mechanism is cooperative and cannot be otherwise.** C++ has no way to forcibly kill a thread, because there is no safe point at which to do it — the thread might hold a lock, be halfway through updating a data structure, or own resources with no chance to release them. Every threading library that offered forcible termination has regretted it.",
        "So cancellation is a *request* the thread must check. **If the callable takes a `std::stop_token` as its first parameter, `jthread` passes one automatically**, and the thread polls `stop_requested()` at points where stopping is safe.",
        "**`request_stop()`** sets the flag; the destructor calls it for you. **`std::stop_callback`** registers a function to run when a stop is requested, which is how you wake a thread blocked on a condition variable — the C++20 `condition_variable_any::wait` overloads take a `stop_token` for exactly this.",
        "**A thread that never checks its token cannot be stopped**, and the `jthread` destructor will then block forever waiting to join. Cooperative means cooperative.",
      ],
      examples: [
        {
          id: "raii-and-stop",
          title: "The wrapper `jthread` replaces, and a worker that stops promptly",
          lang: "cpp",
          code: `#include <chrono>
#include <iostream>
#include <stdexcept>
#include <thread>
#include <vector>

using namespace std::chrono_literals;

// What people wrote before C++20 -- jthread is this, standardised.
class JoiningThread {
public:
    template <typename... Args>
    explicit JoiningThread(Args&&... args)
        : t_(std::forward<Args>(args)...) {}

    ~JoiningThread() { if (t_.joinable()) t_.join(); }

    JoiningThread(JoiningThread&&) noexcept = default;
    JoiningThread& operator=(JoiningThread&&) noexcept = default;

private:
    std::thread t_;
};

int main() {
    // Exception safety: the join happens even though we throw.
    std::cout << "throwing between construction and scope exit:\\n";
    try {
        JoiningThread jt{[]{
            std::this_thread::sleep_for(20ms);
            std::cout << "  worker finished normally\\n";
        }};
        throw std::runtime_error("boom");
    } catch (const std::exception& e) {
        std::cout << "  caught: " << e.what() << " (and the thread was joined)\\n";
    }

    // A worker that checks its token often enough to stop promptly.
    std::cout << "\\nstop_token checked inside the work loop:\\n";
    {
        std::jthread w{[](std::stop_token st) {
            for (int i = 0; i < 1000; ++i) {
                if (st.stop_requested()) {
                    std::cout << "  observed stop at iteration " << i << '\\n';
                    return;
                }
                std::this_thread::sleep_for(1ms);
            }
            std::cout << "  finished all 1000 iterations\\n";
        }};
        std::this_thread::sleep_for(25ms);
        std::cout << "  requesting stop\\n";
    }   // destructor: request_stop(), then join()

    std::cout << "\\nstop_callback fires when a stop is requested:\\n";
    {
        std::jthread w{[](std::stop_token st) {
            std::stop_callback cb{st, []{
                std::cout << "  [callback] stop was requested\\n";
            }};
            while (!st.stop_requested()) std::this_thread::sleep_for(1ms);
            std::cout << "  worker exiting\\n";
        }};
        std::this_thread::sleep_for(15ms);
    }
    std::cout << "done\\n";
}`,
          output: `throwing between construction and scope exit:
  worker finished normally
  caught: boom (and the thread was joined)

stop_token checked inside the work loop:
  requesting stop
  observed stop at iteration 23

stop_callback fires when a stop is requested:
  [callback] stop was requested
  worker exiting
done

# the iteration number varies between runs (23, 24, 23 across three here) --
# it is a timing measurement, not a deterministic result.`,
          explanation:
            "**The exception propagated and the thread was still joined**, because `~JoiningThread` ran during unwinding — the same RAII guarantee module 10 built on. The worker observed the stop after roughly 23 iterations rather than running all 1000, because it checks its token every millisecond; a loop that only checked once per second would take a second to notice, which is the tuning question cooperative cancellation always poses. **The exact number differs on every run**, and any concurrency example that prints a stable number is either lucky or not really concurrent. `stop_callback` fires on the requesting thread and is the hook for waking something that is blocked rather than looping.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What happens if you destroy a joinable `std::thread`?",
      answer:
        "`std::terminate` is called and the process aborts — no exception, no cleanup. It is deliberate: implicitly joining would mean a destructor that blocks for an unbounded time, possibly during stack unwinding, and implicitly detaching would leave a thread running with references to variables being destroyed right then, which is a silent use-after-free. The committee chose the loud failure. The practical consequence is that a `std::thread` must be joined on every exit path including exceptional ones, which is why an RAII wrapper — or `std::jthread` — is the right answer.",
    },
    {
      question: "What is `std::jthread` and why prefer it?",
      answer:
        "A thread whose destructor requests a stop and then joins. The automatic join makes it exception-safe by construction, exactly as `unique_ptr` did for `new`/`delete`: cleanup lives in a destructor that runs on every path, so a throw between launch and join no longer aborts the process. It also carries a `std::stop_source`, so it supports cooperative cancellation. There is essentially no reason to use `std::thread` in new C++20 code — `jthread` is the wrapper everyone was already writing, standardised.",
    },
    {
      question: "Why is thread cancellation cooperative rather than forcible?",
      answer:
        "Because there is no safe point at which to kill a thread from outside. It might hold a mutex, be halfway through updating a data structure, or own resources it would never get to release — killing it would leave the program in an unrecoverable state with locks held forever. Every library that offered forcible termination, including POSIX's `pthread_cancel` and Java's `Thread.stop`, has deprecated or regretted it. So C++ makes stopping a *request*: the callable takes a `std::stop_token`, polls `stop_requested()` where stopping is safe, and returns. A thread that never checks cannot be stopped, and the `jthread` destructor will block forever waiting for it.",
    },
    {
      question: "How are arguments passed to a thread function?",
      answer:
        "They are copied — or moved — into storage owned by the thread, then forwarded to the callable. That is a safety default: the thread may outlive the caller's scope, so copying avoids dangling. To pass by reference you must wrap the argument in `std::ref` or `std::cref`, which explicitly opts out and makes you responsible for the referent outliving the thread. A related consequence is that arguments are forwarded as rvalues into the callable, so a function taking a non-const lvalue reference will not compile without `std::ref`.",
    },
    {
      question: "When would you use `detach`?",
      answer:
        "Almost never. `detach` severs the handle, so the thread runs to completion on its own and you can never join it, wait for it, or learn when it finished. The usual bug is that a detached thread refers to something in the scope that is about to be destroyed, giving a use-after-free with no diagnostic. At program exit, detached threads are killed wherever they happen to be, with no unwinding and no destructors, so any buffered output or pending cleanup is lost. The rare legitimate use is a truly fire-and-forget task with no shared state and no need for completion, and even then a thread pool with proper lifetime management is usually better.",
    },
    {
      question: "What does `hardware_concurrency()` tell you?",
      answer:
        "The number of concurrent threads the implementation believes the hardware supports — typically cores times SMT threads per core. It is explicitly a *hint*: it may return 0 when the implementation cannot determine it, and it does not account for CPU affinity masks, container CPU limits, or other load on the machine, so a containerised process may see the host's count rather than its quota. Use it to size a pool as a starting point, always handle the 0 case, and prefer a configurable override for anything running in production.",
    },
  ],
  takeaways: [
    "A `std::thread` starts running the moment it is constructed — there is no separate start",
    "Arguments are copied into the thread's storage; use `std::ref` to pass a reference",
    "Threads are move-only, since two handles to one OS thread is meaningless",
    "Destroying a joinable thread calls `std::terminate` — no exception, no cleanup",
    "That is deliberate: implicit join could hang, implicit detach would dangle silently",
    "A throw between construction and `join()` turns a recoverable error into an abort",
    "`detach` is almost always wrong and leaves you unable to wait for the thread",
    "Detached threads are killed at program exit with no unwinding",
    "`std::jthread` requests a stop and joins in its destructor — prefer it always",
    "Cancellation is cooperative because there is no safe point to kill a thread from outside",
    "A callable taking `std::stop_token` first gets one automatically from `jthread`",
    "A thread that never checks its token cannot be stopped, and the destructor will block",
    "`hardware_concurrency()` is a hint, may return 0, and ignores container CPU limits",
  ],
  status: "available",
};
