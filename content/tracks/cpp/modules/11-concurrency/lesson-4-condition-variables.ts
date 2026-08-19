import type { Lesson } from "@/content/types";

export const conditionVariablesLesson: Lesson = {
  id: "cpp-condition-variables",
  slug: "condition-variables-and-a-correct-queue",
  moduleSlug: "concurrency",
  title: "Condition Variables & a Producer/Consumer Queue That Is Actually Correct",
  summary:
    "Waiting for something to become true without burning a core. Spurious wakeups, the lost wakeup that hangs your program, and why the predicate form of `wait` is not optional — assembled into a bounded blocking queue with a shutdown path, verified clean under ThreadSanitizer.",
  estimatedMinutes: 40,
  objectives: [
    "Explain what problem a condition variable solves that a mutex alone cannot",
    "Use the predicate form of `wait` and say why the loop form is mandatory",
    "Describe spurious wakeups and lost wakeups",
    "Choose between `notify_one` and `notify_all`",
    "Write a bounded blocking queue with a correct shutdown path",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "Waiting without spinning",
      body: [
        "A mutex answers \"only one thread at a time\". It does not answer **\"wait until this becomes true\"**, and that is a different problem.",
        "The naive solution is to spin: lock, check, unlock, repeat. It works and it is terrible — a core runs flat out doing nothing, and on a busy machine the spinning thread competes with the one that would make the condition true.",
        "**A condition variable lets a thread sleep until another thread signals it.** The waiting thread consumes no CPU; the OS scheduler does not even consider it runnable until it is notified.",
        "The mechanics are subtle and worth stating exactly. **`wait(lock)` atomically releases the mutex and blocks.** Both, indivisibly — which is the whole point, because a gap between unlocking and blocking is where a notification gets lost. On waking, it **reacquires the mutex before returning**, so the code after `wait` runs with the lock held, exactly as before.",
        "**This is why `wait` requires a `std::unique_lock` and not a `lock_guard`**: it must unlock and relock, and `lock_guard` cannot do that.",
      ],
      examples: [
        {
          id: "cv-basics",
          title: "The predicate form, and what it protects you from",
          lang: "cpp",
          code: `#include <chrono>
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <thread>

using namespace std::chrono_literals;

std::mutex              m;
std::condition_variable cv;
bool                    ready = false;
int                     payload = 0;

int main() {
    std::jthread producer{[]{
        std::this_thread::sleep_for(30ms);
        {
            std::lock_guard lk{m};
            payload = 42;
            ready   = true;        // set the CONDITION under the mutex
        }
        cv.notify_one();           // notify OUTSIDE the lock
    }};

    {
        std::unique_lock lk{m};
        // The predicate form. Equivalent to:
        //     while (!ready) cv.wait(lk);
        // The loop is mandatory -- see the explanation.
        cv.wait(lk, []{ return ready; });
        std::cout << "consumer woke with payload = " << payload << '\\n';
    }

    // wait_for adds a timeout and reports why it returned.
    std::mutex m2;
    std::condition_variable cv2;
    bool never = false;
    {
        std::unique_lock lk{m2};
        bool got = cv2.wait_for(lk, 20ms, [&]{ return never; });
        std::cout << "wait_for timed out, predicate satisfied = "
                  << std::boolalpha << got << '\\n';
    }

    std::cout << "\\nthe predicate form is not a convenience -- it is required\\n"
                 "for correctness against spurious and lost wakeups.\\n";
}`,
          output: `consumer woke with payload = 42
wait_for timed out, predicate satisfied = false

the predicate form is not a convenience -- it is required
for correctness against spurious and lost wakeups.`,
          explanation:
            "**Three details in that producer are all load-bearing.** The condition `ready` is set *under the mutex*, because it is shared state and an unsynchronised write would be a data race. The `notify_one` is called *outside* the lock, so the woken consumer does not immediately block trying to acquire a mutex the notifier still holds. And the consumer uses the **predicate form**, which is the subject of the next section. Note `wait_for` returns the predicate's final value, so `false` means it timed out rather than being satisfied.",
        },
      ],
    },
    {
      id: "spurious-and-lost",
      heading: "Spurious wakeups and lost wakeups",
      body: [
        "Two distinct failure modes, often confused, and the predicate form of `wait` handles both.",
        "**A spurious wakeup is `wait` returning without any notification.** The standard explicitly permits it, and it is not a bug in the implementation — it falls out of how futexes and POSIX condition variables interact with signals, and forbidding it would make them slower. **The consequence is that waking up tells you nothing.** You must re-check the condition.",
        "**A lost wakeup is a notification that arrives before anyone is waiting**, and is simply dropped. A condition variable has no memory: `notify_one` with no waiter notifies nobody, and the thread that starts waiting a microsecond later waits forever. **This is why the condition must be set under the same mutex the waiter holds** — that ordering is what makes it impossible for the waiter to check the condition, find it false, and then miss the notification.",
        "**The predicate form handles both**: `cv.wait(lk, pred)` is exactly `while (!pred()) cv.wait(lk);`. It checks the predicate *before* waiting at all — so a condition that is already true never waits, closing the lost-wakeup window — and re-checks after every wake, so a spurious one loops back.",
        "**Never write the plain `cv.wait(lk)` form without a surrounding loop.** It is correct only if you can prove no spurious wakeup can matter, which you cannot.",
        "**`notify_one` versus `notify_all`**: use `notify_one` when any single waiter can handle the event and they are interchangeable — one item pushed, one consumer needed. Use `notify_all` when the state change is relevant to every waiter, which is essentially always true of **shutdown**, and when waiters are waiting for *different* conditions on the same variable, since `notify_one` might wake one whose predicate is still false and the event is then lost to the others.",
      ],
      examples: [
        {
          id: "why-predicate",
          title: "The three shapes, and which are correct",
          lang: "cpp",
          code: `#include <condition_variable>
#include <mutex>

std::mutex m;
std::condition_variable cv;
bool ready = false;

// ── WRONG: no loop. A spurious wakeup proceeds with ready == false.
void broken() {
    std::unique_lock lk{m};
    cv.wait(lk);              // may return for no reason at all
    /* use the data */        // ...which may not be there
}

// ── CORRECT: the explicit loop.
void okExplicit() {
    std::unique_lock lk{m};
    while (!ready) cv.wait(lk);
    /* use the data */
}

// ── CORRECT and preferred: the predicate form, identical semantics.
void okPredicate() {
    std::unique_lock lk{m};
    cv.wait(lk, []{ return ready; });
    /* use the data */
}

// ── The producer side. All three lines matter.
void producer() {
    {
        std::lock_guard lk{m};
        ready = true;         // 1. set the condition UNDER the mutex
    }                         // 2. release the mutex
    cv.notify_one();          // 3. notify outside the lock
}

int main() {}`,
          output: `# Why each producer step matters:
#
#  1. Setting 'ready' without the mutex is a data race, AND it opens the
#     lost-wakeup window: the waiter could test it, see false, and only
#     then start waiting -- after the notify has already happened.
#
#  2/3. Notifying while still holding the lock is correct but wasteful:
#     the woken thread immediately blocks again on the mutex you are
#     still holding. Release first.`,
          explanation:
            "**`broken()` compiles, passes review from anyone who has not been bitten, and fails rarely enough to reach production.** A spurious wakeup returns from `wait` with `ready` still false, and the code proceeds to use data that was never produced. The two correct forms are exactly equivalent — `wait(lk, pred)` is specified as the `while` loop — so prefer the predicate version for being harder to get wrong. Note that step 1 is doing double duty: it prevents a data race *and* closes the lost-wakeup race, which is why \"set the condition under the mutex\" is stated as an absolute rule.",
        },
      ],
    },
    {
      id: "the-queue",
      heading: "A queue that is actually correct",
      body: [
        "The producer/consumer queue is the canonical use, and almost every version written from memory has at least one of these bugs: no bound so producers can exhaust memory, a plain `wait` so a spurious wakeup pops an empty queue, or no shutdown path so consumers block forever and the program hangs at exit.",
        "**The shutdown path is the one people forget.** A consumer blocked in `wait` for an item that will never come cannot be joined, so the process hangs — and since `jthread` joins in its destructor, the hang appears at a closing brace far from the queue.",
        "The fix is a `closed_` flag that participates in **both** predicates. A waiting consumer wakes on either \"something to pop\" or \"we are shutting down\", and distinguishes them after waking. `close()` must use **`notify_all`**, because every waiter needs to learn about it, not one.",
        "**Draining matters too.** `pop` returning `nullopt` as soon as `closed_` is set would discard items already queued. The correct predicate wakes on `!q_.empty() || closed_`, and then returns `nullopt` only if the queue is *actually empty* — so a close followed by drain loses nothing.",
        "**Two condition variables, not one.** `notEmpty_` for consumers and `notFull_` for producers. Sharing one would mean waking producers when an item arrives and consumers when space appears, which works but wastes wakeups — and with `notify_one` on a shared variable you can wake the wrong kind of waiter and lose the event entirely.",
      ],
      examples: [
        {
          id: "blocking-queue",
          title: "Bounded, closeable, TSan-clean",
          lang: "cpp",
          code: `#include <atomic>
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <optional>
#include <queue>
#include <thread>
#include <vector>

template <typename T>
class BlockingQueue {
public:
    explicit BlockingQueue(std::size_t capacity) : capacity_(capacity) {}

    bool push(T value) {
        {
            std::unique_lock lk{m_};
            notFull_.wait(lk, [this]{ return q_.size() < capacity_ || closed_; });
            if (closed_) return false;
            q_.push(std::move(value));
        }
        notEmpty_.notify_one();          // notify outside the lock
        return true;
    }

    // Returns nullopt only when the queue is closed AND drained.
    std::optional<T> pop() {
        T value;
        {
            std::unique_lock lk{m_};
            notEmpty_.wait(lk, [this]{ return !q_.empty() || closed_; });
            if (q_.empty()) return std::nullopt;    // closed and drained
            value = std::move(q_.front());
            q_.pop();
        }
        notFull_.notify_one();
        return value;
    }

    void close() {
        {
            std::lock_guard lk{m_};
            closed_ = true;
        }
        notEmpty_.notify_all();          // wake EVERY waiter, not one
        notFull_.notify_all();
    }

private:
    mutable std::mutex      m_;
    std::condition_variable notEmpty_, notFull_;
    std::queue<T>           q_;
    std::size_t             capacity_;
    bool                    closed_ = false;
};

int main() {
    BlockingQueue<int> q{4};             // small, to force blocking
    std::atomic<int>       consumed = 0;
    std::atomic<long long> sum      = 0;

    constexpr int PRODUCERS = 2, CONSUMERS = 3, PER_PRODUCER = 500;

    {
        std::vector<std::jthread> consumers;
        for (int c = 0; c < CONSUMERS; ++c)
            consumers.emplace_back([&]{
                while (auto v = q.pop()) { sum += *v; ++consumed; }
            });

        {
            std::vector<std::jthread> producers;
            for (int p = 0; p < PRODUCERS; ++p)
                producers.emplace_back([&, p]{
                    for (int i = 0; i < PER_PRODUCER; ++i)
                        q.push(p * PER_PRODUCER + i);
                });
        }   // all producers joined here

        q.close();                       // now let consumers drain and exit
    }

    const int expected = PRODUCERS * PER_PRODUCER;
    long long expectedSum = 0;
    for (int i = 0; i < expected; ++i) expectedSum += i;

    std::cout << "produced : " << expected << '\\n';
    std::cout << "consumed : " << consumed.load() << '\\n';
    std::cout << "sum      : " << sum.load()
              << " (expected " << expectedSum << ")\\n";
    std::cout << "all consumers exited cleanly -- no hang, nothing lost\\n";
}`,
          output: `produced : 1000
consumed : 1000
sum      : 499500 (expected 499500)
all consumers exited cleanly -- no hang, nothing lost

# identical across three runs, and:
$ g++ -std=c++20 -fsanitize=thread -g -pthread && ./queue
[0 ThreadSanitizer warnings]`,
          explanation:
            "**Every item produced was consumed exactly once, and the sum proves none were duplicated or lost.** The ordering in `main` is the part worth studying: producers are joined *first*, then `close()` is called, and only then are the consumers joined — because closing before the producers finish would reject their remaining pushes. The consumers drain what is left and exit on `nullopt`. **A queue without `close()` would hang here forever**, with three consumers blocked in `wait` and the program stuck at a closing brace.",
        },
      ],
      pitfalls: [
        {
          title: "C++20 gives you simpler tools for the common cases",
          body: "A condition variable is the general mechanism and often more than you need. **`std::counting_semaphore` / `std::binary_semaphore`** handle \"N permits available\" directly, and unlike a condition variable a semaphore *remembers* a release with no waiter, so there is no lost-wakeup problem. **`std::latch`** is a one-shot \"wait until N things have happened\". **`std::barrier`** is a reusable rendezvous for a fixed group of threads. **`std::atomic<T>::wait`/`notify_one`** gives efficient waiting on a single atomic with no mutex at all. Reach for the specific tool when it fits — each is harder to get wrong than a hand-written condition variable.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does a condition variable do that a mutex cannot?",
      answer:
        "A mutex provides mutual exclusion; it has no way to express \"wait until this becomes true\". Doing that with a mutex alone means spinning — lock, check, unlock, repeat — which burns a core and competes with the thread that would make the condition true. A condition variable lets a thread sleep until notified, consuming no CPU. Its key operation is that `wait(lock)` *atomically* releases the mutex and blocks: both indivisibly, because any gap between unlocking and blocking is exactly where a notification would be lost. On waking it reacquires the mutex before returning, which is why it needs a `unique_lock` rather than a `lock_guard`.",
    },
    {
      question: "What is a spurious wakeup, and how do you handle it?",
      answer:
        "`wait` returning without any notification having occurred. The standard explicitly permits it — it falls out of how futexes and POSIX condition variables interact with signals, and forbidding it would make implementations slower. The consequence is that waking up conveys no information, so you must re-check the condition. That is what the predicate form does: `cv.wait(lk, pred)` is specified as exactly `while (!pred()) cv.wait(lk);`, looping back if the predicate is still false. Writing a bare `cv.wait(lk)` without a surrounding loop is a latent bug that fails rarely enough to reach production.",
    },
    {
      question: "What is a lost wakeup and how is it prevented?",
      answer:
        "A notification sent when no thread is waiting, which is simply dropped — a condition variable has no memory. If a consumer checks the condition, finds it false, and only then starts waiting, a `notify_one` that happened in between is gone and the consumer waits forever. It is prevented by setting the condition *under the same mutex the waiter holds*: that makes the check-then-wait sequence atomic with respect to the set-then-notify sequence, so the notification cannot slip into the gap. The predicate form also helps by testing before waiting at all, so an already-true condition never blocks. Semaphores do not have this problem, because a release with no waiter is remembered.",
    },
    {
      question: "When should you use `notify_all` rather than `notify_one`?",
      answer:
        "`notify_one` is right when any single waiter can handle the event and they are interchangeable — one item pushed, one of several equivalent consumers needed — and it avoids the thundering herd of waking everyone to have all but one go back to sleep. `notify_all` is required when the state change matters to every waiter, which is essentially always true of shutdown, and when waiters on the same condition variable are waiting for *different* predicates: `notify_one` might wake a thread whose predicate is still false, which returns to waiting, and the event is lost to the thread that could have used it.",
    },
    {
      question: "What does a correct producer/consumer queue need that a naive one lacks?",
      answer:
        "A bound, so producers cannot exhaust memory when consumers fall behind — which means producers block too, needing a second condition variable. The predicate form of `wait`, so a spurious wakeup cannot pop an empty queue. And a shutdown path: a `closed_` flag participating in both predicates, with `close()` using `notify_all`. Without shutdown, consumers blocked waiting for an item that never comes cannot be joined and the process hangs — and with `jthread` that hang appears at a closing brace far from the queue. The close must also allow draining: `pop` should return empty only when the queue is closed *and* actually empty, or queued items are discarded.",
    },
    {
      question: "What C++20 alternatives exist to condition variables?",
      answer:
        "`std::counting_semaphore` and `std::binary_semaphore` for permit-counting, and unlike a condition variable a semaphore remembers a release with no waiter, so lost wakeups are impossible. `std::latch` for a one-shot \"wait until N things have happened\". `std::barrier` for a reusable rendezvous among a fixed set of threads. And `std::atomic<T>::wait`/`notify_one`/`notify_all` for efficiently waiting on a single atomic without any mutex. Each is more specific and correspondingly harder to misuse than a hand-written condition variable, so prefer whichever actually fits the problem.",
    },
  ],
  takeaways: [
    "A condition variable answers \"wait until true\"; a mutex only answers \"one at a time\"",
    "`wait(lock)` atomically releases the mutex and blocks, then reacquires before returning",
    "That is why `wait` needs `unique_lock` — `lock_guard` cannot unlock and relock",
    "A spurious wakeup is `wait` returning with no notification, and is explicitly permitted",
    "A lost wakeup is a notification with no waiter, which is dropped — CVs have no memory",
    "`cv.wait(lk, pred)` is exactly `while (!pred()) cv.wait(lk);` and handles both",
    "Never write a bare `cv.wait(lk)` without a loop",
    "Always set the condition under the same mutex the waiter holds",
    "Notify outside the lock, so the woken thread does not immediately block",
    "`notify_one` for interchangeable waiters; `notify_all` for shutdown and mixed predicates",
    "A correct queue needs a bound, a predicate wait, and a shutdown path",
    "Without shutdown, blocked consumers hang the program at a distant closing brace",
    "Close must allow draining — return empty only when closed *and* empty",
    "Prefer `semaphore`, `latch`, `barrier` or `atomic::wait` when one of them fits",
  ],
  status: "available",
};
