import type { Lesson } from "@/content/types";

export const futuresLesson: Lesson = {
  id: "cpp-futures",
  slug: "future-promise-async-and-packaged-task",
  moduleSlug: "concurrency",
  title: "future, promise, async & packaged_task",
  summary:
    "Getting a *result* back from another thread instead of managing the thread yourself — including exceptions, which cross the boundary intact. Plus the `std::async` destructor trap that silently serialised three parallel tasks into 301ms of sequential work.",
  estimatedMinutes: 35,
  objectives: [
    "Retrieve a value and an exception from another thread",
    "Distinguish `async`, `promise` and `packaged_task` and pick the right one",
    "Explain why a discarded `std::async` future blocks",
    "Always pass `std::launch::async` and say why",
    "Use `shared_future` for several waiters",
  ],
  sections: [
    {
      id: "the-model",
      heading: "Results, not threads",
      body: [
        "Everything so far has been about managing threads. **Futures are about managing results** — you say what you want computed, and get an object representing the answer that will exist later.",
        "The pair is a **shared state** with two handles. A **`std::promise`** is the writing end; a **`std::future`** is the reading end. One value is transferred, once.",
        "**`future::get()` blocks until the value is ready, then returns it — and may only be called once.** It *moves* the value out, leaving the future invalid, which is why a second `get()` throws `std::future_error`. When several parties need the answer, use `shared_future`.",
        "**Exceptions cross the boundary.** If the producing code throws, the exception is captured with `std::current_exception` and rethrown from `get()` in the consuming thread. That is a genuinely valuable property: with a raw `std::thread`, an escaping exception calls `std::terminate` and there is nothing you can do about it, so futures are the only standard way to propagate a failure out of a worker.",
        "**Three ways to produce the value**, in increasing order of manual control: **`std::async`** runs a function and hands you the future; **`std::packaged_task`** wraps a callable so its result lands in a future you hold, and you decide where to run it; **`std::promise`** lets you set the value from anywhere, for cases where it does not come from a function return at all.",
      ],
      examples: [
        {
          id: "futures-tour",
          title: "All four mechanisms, including an exception crossing threads",
          lang: "cpp",
          code: `#include <chrono>
#include <future>
#include <iostream>
#include <mutex>
#include <numeric>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

using namespace std::chrono_literals;

int slowSquare(int x) {
    std::this_thread::sleep_for(20ms);
    return x * x;
}
int alwaysThrows() { throw std::runtime_error("worker failed"); }

int main() {
    // 1. async: launch, get a future, retrieve the value later.
    std::cout << "std::async with launch::async:\\n";
    auto f = std::async(std::launch::async, slowSquare, 7);
    std::cout << "  doing other work while it runs\\n";
    std::cout << "  result = " << f.get() << '\\n';

    // 2. Exceptions propagate through the future to whoever calls get().
    std::cout << "\\nexceptions cross the thread boundary:\\n";
    auto bad = std::async(std::launch::async, alwaysThrows);
    try {
        bad.get();
    } catch (const std::runtime_error& e) {
        std::cout << "  caught in the caller: " << e.what() << '\\n';
    }

    // 3. promise/future: manual handoff, for values that are not a return.
    std::cout << "\\npromise / future:\\n";
    std::promise<std::string> p;
    std::future<std::string> pf = p.get_future();
    std::jthread setter{[&p]{
        std::this_thread::sleep_for(10ms);
        p.set_value("handed over");
    }};
    std::cout << "  got: " << pf.get() << '\\n';

    // 4. packaged_task: wraps a callable so its result lands in a future.
    std::cout << "\\npackaged_task:\\n";
    std::packaged_task<int(int)> task{slowSquare};
    std::future<int> tf = task.get_future();
    std::jthread runner{std::move(task), 9};
    std::cout << "  result = " << tf.get() << '\\n';

    // 5. shared_future: many waiters for one result.
    std::cout << "\\nshared_future, three waiters:\\n";
    std::promise<int> sp;
    std::shared_future<int> sf = sp.get_future().share();
    std::mutex coutMutex;                 // cout is not race-free: serialise it
    {
        std::vector<std::jthread> waiters;
        for (int i = 0; i < 3; ++i)
            waiters.emplace_back([sf, i, &coutMutex]{
                int v = sf.get();         // all three see the SAME value
                std::lock_guard lk{coutMutex};
                std::cout << "  waiter " << i << " saw " << v << '\\n';
            });
        std::this_thread::sleep_for(10ms);
        sp.set_value(123);
    }

    // 6. Parallel sum with futures.
    std::cout << "\\nparallel sum with four futures:\\n";
    std::vector<int> data(1000000, 1);
    const std::size_t chunk = data.size() / 4;
    std::vector<std::future<long long>> parts;
    for (int i = 0; i < 4; ++i) {
        auto begin = data.begin() + static_cast<long>(i * chunk);
        auto end   = (i == 3) ? data.end() : begin + static_cast<long>(chunk);
        parts.push_back(std::async(std::launch::async, [begin, end]{
            return std::accumulate(begin, end, 0LL);
        }));
    }
    long long total = 0;
    for (auto& part : parts) total += part.get();
    std::cout << "  total = " << total << '\\n';
}`,
          output: `std::async with launch::async:
  doing other work while it runs
  result = 49

exceptions cross the thread boundary:
  caught in the caller: worker failed

promise / future:
  got: handed over

packaged_task:
  result = 81

shared_future, three waiters:
  waiter 0 saw 123
  waiter 1 saw 123
  waiter 2 saw 123

parallel sum with four futures:
  total = 1000000`,
          explanation:
            "**The exception case is the one to notice.** `alwaysThrows` threw on a worker thread and was caught by an ordinary `catch` in `main` — with a raw `std::thread` that same throw would have called `std::terminate` with no recourse. Note the `coutMutex` in the `shared_future` block: **`std::cout` is not race-free**, and without it the three lines interleave into garbage — which is exactly what happened the first time this example was run. Each `shared_future` copy can call `get()` independently and all three see 123.",
        },
      ],
    },
    {
      id: "async-traps",
      heading: "The two `std::async` traps",
      body: [
        "`std::async` is the most convenient of the three and has two sharp edges that are worth knowing before you use it.",
        "**The default launch policy may not run anything in parallel.** Called without a policy, `std::async(f)` means `std::launch::async | std::launch::deferred` — the implementation *chooses*. With `deferred`, nothing runs until you call `get()`, and then it runs **on the calling thread**. So code that looks parallel may be entirely sequential, and code that never calls `get()` never runs at all. **Always pass `std::launch::async` explicitly** if you want a thread.",
        "**The returned future's destructor blocks.** This is unique to futures from `std::async`: `~future` waits for the task to finish. It exists so a task cannot outlive the data it captured, but it makes discarding the return value catastrophic — the temporary future is destroyed at the end of the *statement*, so the task is launched and immediately waited for, one at a time.",
        "The measurement below makes it concrete: **three 100ms tasks take 301ms when the futures are discarded and 100ms when they are kept.** GCC helps by marking `std::async` `[[nodiscard]]`, so discarding it is at least a warning.",
        "**When to use which.** `std::async` for one-off parallel computations where the fire-and-collect shape fits. `packaged_task` when you need to decide where the work runs — a thread pool queues `packaged_task`s. `promise` when the value is produced by something that is not a function call, such as a callback from a C library or an event loop.",
      ],
      examples: [
        {
          id: "async-destructor",
          title: "Three parallel tasks that took 301ms",
          lang: "cpp",
          code: `#include <chrono>
#include <future>
#include <iostream>
#include <thread>
#include <vector>

using namespace std::chrono_literals;

int main() {
    // Discarding the future: ~future() blocks, so these run SEQUENTIALLY.
    auto t0 = std::chrono::steady_clock::now();
    for (int i = 0; i < 3; ++i)
        std::async(std::launch::async, []{ std::this_thread::sleep_for(100ms); });
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
                  std::chrono::steady_clock::now() - t0).count();
    std::cout << "three 100ms tasks, results discarded: " << ms << " ms\\n";

    // Keeping the futures: all three run at once.
    t0 = std::chrono::steady_clock::now();
    {
        std::vector<std::future<void>> fs;
        for (int i = 0; i < 3; ++i)
            fs.push_back(std::async(std::launch::async,
                                    []{ std::this_thread::sleep_for(100ms); }));
    }
    ms = std::chrono::duration_cast<std::chrono::milliseconds>(
             std::chrono::steady_clock::now() - t0).count();
    std::cout << "three 100ms tasks, futures kept:     " << ms << " ms\\n";
}`,
          output: `$ g++ -std=c++20 -Wall -Wextra -pthread async.cpp
warning: ignoring return value of 'std::future<...> std::async(...)',
declared with attribute 'nodiscard' [-Wunused-result]

$ ./a.out
three 100ms tasks, results discarded: 301 ms
three 100ms tasks, futures kept:     100 ms`,
          explanation:
            "**301ms against 100ms — the discarded version was fully sequential.** Each temporary future was destroyed at the semicolon, and its destructor waited for that task before the loop launched the next. The code reads as three parallel tasks and behaves as three sequential ones. GCC's `[[nodiscard]]` warning is the only thing standing between this and a silent performance bug, which is a strong argument for treating that warning as an error.",
        },
      ],
      pitfalls: [
        {
          title: "`std::async` is not a thread pool",
          body: "Each `std::async(std::launch::async, ...)` call is permitted to create a fresh OS thread, and libstdc++ does exactly that. Launching a thousand tasks means a thousand thread creations, each costing on the order of tens of microseconds plus a default stack reservation — usually 8MB of address space on Linux. For a handful of coarse-grained tasks that is fine; for fine-grained parallelism it is far slower than the work itself. Use a real thread pool with `packaged_task`, or C++17's parallel algorithms (`std::execution::par`), which are backed by a pool on most implementations.",
        },
      ],
    },
    {
      id: "pool",
      heading: "A thread pool from `packaged_task`",
      body: [
        "`packaged_task` exists precisely because `std::async` decides where the work runs and sometimes you need to decide that yourself.",
        "The shape is the blocking queue from lesson 4 holding `std::packaged_task<void()>` — or `std::move_only_function<void()>` in C++23, since a `packaged_task` is move-only and cannot go in a `std::function`.",
        "**`submit` wraps the caller's callable in a `packaged_task`, takes its future, queues the task, and returns the future.** Workers pop tasks and invoke them; invoking a `packaged_task` stores the result — or the exception — in the shared state, waking whoever holds the future.",
        "This gives you the good parts of `std::async` with none of the traps: a fixed number of threads created once, no blocking destructor, and full control over queue depth and shutdown.",
      ],
      examples: [
        {
          id: "thread-pool",
          title: "A small pool, with results and exceptions returned as futures",
          lang: "cpp",
          code: `#include <condition_variable>
#include <functional>
#include <future>
#include <iostream>
#include <mutex>
#include <queue>
#include <stdexcept>
#include <thread>
#include <vector>

class ThreadPool {
public:
    explicit ThreadPool(unsigned n) {
        for (unsigned i = 0; i < n; ++i)
            workers_.emplace_back([this]{ run(); });
    }

    ~ThreadPool() {
        {
            std::lock_guard lk{m_};
            closed_ = true;
        }
        cv_.notify_all();          // wake every worker so they can exit
    }

    // Returns a future for whatever the callable returns.
    template <typename F>
    auto submit(F f) -> std::future<decltype(f())> {
        using R = decltype(f());
        auto task = std::make_shared<std::packaged_task<R()>>(std::move(f));
        std::future<R> fut = task->get_future();
        {
            std::lock_guard lk{m_};
            if (closed_) throw std::runtime_error("pool is shut down");
            jobs_.emplace([task]{ (*task)(); });
        }
        cv_.notify_one();
        return fut;
    }

private:
    void run() {
        for (;;) {
            std::function<void()> job;
            {
                std::unique_lock lk{m_};
                cv_.wait(lk, [this]{ return !jobs_.empty() || closed_; });
                if (jobs_.empty()) return;         // closed and drained
                job = std::move(jobs_.front());
                jobs_.pop();
            }
            job();
        }
    }

    std::mutex                        m_;
    std::condition_variable           cv_;
    std::queue<std::function<void()>> jobs_;
    bool                              closed_ = false;
    std::vector<std::jthread>         workers_;   // declared LAST: joined first
};

int main() {
    std::vector<std::future<int>> results;
    std::future<int>              failing;
    {
        ThreadPool pool{4};
        for (int i = 1; i <= 8; ++i)
            results.push_back(pool.submit([i]{ return i * i; }));

        failing = pool.submit([]() -> int {
            throw std::runtime_error("task blew up");
        });

        int total = 0;
        for (auto& r : results) total += r.get();
        std::cout << "sum of squares 1..8 = " << total << " (expected 204)\\n";

        try {
            failing.get();
        } catch (const std::runtime_error& e) {
            std::cout << "task exception surfaced at get(): " << e.what() << '\\n';
        }
    }
    std::cout << "pool destroyed, all workers joined\\n";
}`,
          output: `sum of squares 1..8 = 204 (expected 204)
task exception surfaced at get(): task blew up
pool destroyed, all workers joined`,
          explanation:
            "**The `workers_` member is declared last on purpose.** Members are destroyed in reverse declaration order, so the `jthread`s are joined *before* the mutex and queue they use are destroyed — reversing those two lines gives a use-after-free during shutdown that is very hard to diagnose. The `shared_ptr<packaged_task>` is a workaround for `std::function` requiring a copyable target, which a `packaged_task` is not; in C++23 `std::move_only_function` removes the need for it.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What problem do futures solve that `std::thread` does not?",
      answer:
        "Getting a *result* back, and getting an *exception* back. A `std::thread` returns nothing, so you need shared state plus synchronisation to retrieve a value, and if the thread function throws, `std::terminate` is called with no way to intervene. A future captures both: `get()` blocks until the value is ready and returns it, and if the producing code threw, the exception is captured and rethrown from `get()` in the consuming thread. That makes futures the only standard mechanism for propagating a failure out of a worker thread.",
      },
    {
      question: "What is the difference between `async`, `packaged_task` and `promise`?",
      answer:
        "They differ in how much control you have over where and when the work happens. `std::async` takes a callable, runs it (possibly on a new thread), and hands you a future — most convenient, least control. `std::packaged_task` wraps a callable so its result lands in a future you hold, but does not run it; you decide where, which is what makes it the right building block for a thread pool. `std::promise` has no callable at all — you set the value explicitly from wherever it becomes available, which suits results arriving from a C callback or an event loop rather than a function return.",
    },
    {
      question: "Why should you always pass `std::launch::async` explicitly?",
      answer:
        "Because the default is `std::launch::async | std::launch::deferred`, which lets the implementation choose. If it picks `deferred`, nothing runs until you call `get()`, and then it runs on the *calling* thread — so code that looks parallel is entirely sequential, and a task whose future is never queried never runs at all. There is no portable way to know which was chosen without inspecting `wait_for` with a zero timeout. Passing the policy explicitly makes the behaviour deterministic.",
    },
    {
      question: "Why does a discarded `std::async` future make tasks run sequentially?",
      answer:
        "Because a future obtained from `std::async` has a destructor that blocks until the task completes — unique to that case, and specified so a task cannot outlive the data it captured. Discarding the return value means the temporary future is destroyed at the end of the statement, so each task is launched and immediately waited for. Measured with three 100ms tasks, discarding the futures took 301ms while keeping them took 100ms; the code reads as parallel and behaves as sequential. GCC marks `std::async` `[[nodiscard]]`, so the mistake is at least a warning.",
    },
    {
      question: "What is a `shared_future` for?",
      answer:
        "Several consumers of one result. A plain `std::future::get()` moves the value out and may only be called once — a second call throws `std::future_error` — because the future owns the result exclusively. `shared_future` is copyable, and every copy can call `get()` independently, all observing the same value. Create one with `future::share()`, which transfers the shared state and leaves the original invalid. It is the right tool for broadcasting a configuration load or an initialisation result to many waiting threads.",
    },
    {
      question: "Why is `std::async` a poor basis for fine-grained parallelism?",
      answer:
        "Because it is not a thread pool. Each call with `launch::async` may create a fresh OS thread, and libstdc++ does, so a thousand tasks means a thousand thread creations — tens of microseconds each plus a default stack reservation of around 8MB of address space on Linux. For a handful of coarse-grained tasks that overhead is irrelevant; for many small ones it dwarfs the work. Use a real pool built on `packaged_task` and a blocking queue, or the C++17 parallel algorithms with `std::execution::par`, which are backed by a pool on most implementations.",
    },
  ],
  takeaways: [
    "Futures manage results; threads manage execution",
    "A `promise` is the writing end and a `future` the reading end of one shared state",
    "`get()` blocks, moves the value out, and may only be called once",
    "Exceptions are captured and rethrown from `get()` — the only way to propagate out of a worker",
    "With a raw `std::thread`, an escaping exception calls `std::terminate`",
    "The default `std::async` policy may run deferred, on the calling thread, or never",
    "Always pass `std::launch::async` explicitly",
    "A future from `std::async` blocks in its destructor",
    "Discarding it serialised three 100ms tasks into 301ms; keeping the futures took 100ms",
    "`std::async` is not a thread pool — each call may create a fresh OS thread",
    "`packaged_task` lets you choose where the work runs, which is what a pool needs",
    "`shared_future` is copyable and lets many waiters read the same result",
    "In a pool class, declare the worker threads last so they are joined before the queue dies",
  ],
  status: "available",
};
