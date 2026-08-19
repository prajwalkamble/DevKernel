import type { Lesson } from "@/content/types";

export const benchmarkingLesson: Lesson = {
  id: "cpp-benchmarking",
  slug: "profilers-benchmarks-and-microbenchmark-traps",
  moduleSlug: "performance-systems",
  title: "Profilers, Benchmarks & the Microbenchmark Traps",
  summary:
    "How to measure without fooling yourself. Four traps demonstrated with real numbers — a deleted loop reporting 1.1ms for work that takes 8.4ms, a constant folded at compile time, and a single operation timed below the clock's resolution — plus what profilers actually tell you.",
  estimatedMinutes: 35,
  objectives: [
    "Explain why measurement must precede optimisation",
    "Recognise the four common microbenchmark traps",
    "Use `DoNotOptimize`-style barriers correctly",
    "Choose between sampling and instrumenting profilers",
    "Interpret a profile without drawing the wrong conclusion",
  ],
  sections: [
    {
      id: "measure-first",
      heading: "Measure, then optimise",
      body: [
        "The rule everyone quotes and few follow: **you cannot predict where time goes.** Modern hardware has out-of-order execution, branch prediction, multiple cache levels, prefetchers and SIMD; compilers reorder, inline, vectorise and eliminate. The relationship between source and runtime is not something intuition tracks.",
        "The failure mode is not \"optimising the wrong 3%\" — that would merely be wasted effort. It is **making the code worse**: harder to read, harder to change, and often slower, because a hand-rolled replacement defeats an optimisation the compiler was already applying.",
        "**Two kinds of measurement answer different questions.** A **profiler** answers \"where does the time go in my real program?\" — that is the one that decides what to work on. A **benchmark** answers \"is version B faster than version A for this specific operation?\" — that is the one that decides whether a change helped.",
        "**Do the profiling first.** A benchmark of a function that accounts for 0.4% of runtime is a well-measured irrelevance.",
        "**And optimise the algorithm before the constant factor.** Nothing in this module beats replacing an O(n²) scan with an O(n log n) one, and the ordering is: better algorithm, better data layout, better constant factor — in that order, because each is worth more than the next and less disruptive than reaching for the one after.",
      ],
      examples: [
        {
          id: "traps",
          title: "Four traps, with numbers",
          lang: "cpp",
          code: `#include <chrono>
#include <cmath>
#include <cstdio>
#include <numeric>
#include <vector>

using Clock = std::chrono::steady_clock;

// The barrier every microbenchmark needs. Google Benchmark spells this
// benchmark::DoNotOptimize.
template <typename T>
void doNotOptimize(T const& v) { asm volatile("" : : "r,m"(v) : "memory"); }

double timeMs(auto f) {
    auto t0 = Clock::now(); f();
    return std::chrono::duration<double, std::milli>(Clock::now() - t0).count();
}

int main() {
    std::vector<double> v(1'000'000);
    std::iota(v.begin(), v.end(), 1.0);

    // TRAP 1: the result is unused, so the whole loop is deleted.
    double t1 = timeMs([&]{
        double s = 0; for (double x : v) s += std::sqrt(x);
    });

    // FIXED: the barrier forces the work to actually happen.
    double t2 = timeMs([&]{
        double s = 0; for (double x : v) s += std::sqrt(x); doNotOptimize(s);
    });

    // TRAP 2: constant input, so sqrt(2.0) is computed at COMPILE time.
    double t3 = timeMs([&]{
        double s = 0;
        for (int i = 0; i < 1'000'000; ++i) s += std::sqrt(2.0);
        doNotOptimize(s);
    });

    // TRAP 3: one operation is far below the clock's useful resolution.
    double one = timeMs([&]{ double s = std::sqrt(2.0); doNotOptimize(s); });

    // FIXED: repeat until the total is measurable, then divide.
    constexpr int REPS = 10'000'000;
    double many = timeMs([&]{
        double s = 0;
        for (int i = 0; i < REPS; ++i) s += std::sqrt(double(i));
        doNotOptimize(s);
    });

    std::printf("1. result discarded     : %9.4f ms   <- loop deleted\\n", t1);
    std::printf("2. doNotOptimize(s)     : %9.4f ms   <- the real cost\\n", t2);
    std::printf("3. sqrt of a CONSTANT   : %9.4f ms   <- folded at compile time\\n", t3);
    std::printf("4. ONE sqrt, timed      : %9.4f ms   <- below clock resolution\\n", one);
    std::printf("5. %d sqrts / N   : %9.7f ms each  <- meaningful\\n", REPS, many / REPS);
}`,
          output: `1. result discarded     :    1.1381 ms   <- loop deleted
2. doNotOptimize(s)     :    8.3627 ms   <- the real cost
3. sqrt of a CONSTANT   :    1.7842 ms   <- folded at compile time
4. ONE sqrt, timed      :    0.0001 ms   <- below clock resolution
5. 10000000 sqrts / N   : 0.0000083 ms each  <- meaningful

# Row 1 reports the work as 7x faster than it is, because it never
# happened. Row 3 reports a million square roots in less time than
# one pass over the array, because the compiler computed sqrt(2.0)
# once at compile time. Both look plausible in isolation.`,
          explanation:
            "**Row 1 against row 2 is the trap that ruins most homemade benchmarks**: 1.14 ms against 8.36 ms for the same source, differing only by whether the result is observed. A benchmark reporting the fast number would \"prove\" an optimisation that does nothing. Row 3 is the same failure with a different cause — a loop-invariant computation hoisted and constant-folded, so the timing measures the loop counter. And row 4 shows why you must repeat: a single `sqrt` is around 8 *nanoseconds*, far below what one `steady_clock` reading can resolve.",
        },
      ],
      pitfalls: [
        {
          title: "Benchmark at your release optimisation level, and pin the machine down",
          body: "A benchmark built at `-O0` measures a program you will never ship, and often reverses the ranking — abstractions that vanish at `-O2` are real function calls at `-O0`. Beyond the flags: CPU frequency scaling means the first run is often at a different clock than the tenth, thermal throttling on a laptop changes results over minutes, and another process on a shared machine will show up as noise. Report a *distribution* rather than a single number, prefer the median or minimum over the mean since noise only adds time, and run enough repetitions that the variance is visible. Google Benchmark does all of this and is worth using rather than reinventing.",
        },
      ],
    },
    {
      id: "profilers",
      heading: "Profilers",
      body: [
        "**A sampling profiler interrupts the program periodically and records the stack.** Overhead is low — a few percent — so it can run on a production-like workload, and what it measures is genuinely representative. `perf` on Linux, Instruments on macOS, VTune, and the sampling mode of most commercial tools work this way. **This is the default choice.**",
        "**An instrumenting profiler adds code at every function entry and exit.** It gives exact call counts and precise per-call attribution, at the cost of large overhead — often 10–50× — which distorts the very thing you are measuring: small functions look disproportionately expensive because the instrumentation is a fixed cost per call. `gprof`, Callgrind and manual scope timers work this way. Use it when you need exact counts, not for timing.",
        "**Hardware performance counters** are the third source, and the most informative for the material in this module. `perf stat` reports cache misses, branch mispredictions, instructions per cycle and stalls — telling you *why* code is slow, not merely where. A high miss rate with a low IPC means memory-bound, which points at lesson 2; a high branch-miss rate points at unpredictable control flow.",
        "**Reading a profile correctly is where people go wrong.** Distinguish **self time** — spent in the function's own code — from **total time**, which includes callees: a function with 90% total and 1% self is not the problem, its callee is. Beware inlining, which attributes a function's cost to its caller. And check the call counts: a function taking 20% of runtime across ten million calls needs a different fix from one taking 20% in a single call.",
      ],
      examples: [
        {
          id: "scope-timer",
          title: "A scope timer for when you have no profiler",
          lang: "cpp",
          code: `#include <chrono>
#include <cstdio>
#include <map>
#include <string>
#include <thread>
#include <vector>

// Not a substitute for a profiler -- but when you cannot install one,
// this finds the hot region in a few minutes.
class ScopeTimer {
public:
    explicit ScopeTimer(const char* name)
        : name_(name), start_(std::chrono::steady_clock::now()) {}

    ~ScopeTimer() {
        auto us = std::chrono::duration_cast<std::chrono::microseconds>(
                      std::chrono::steady_clock::now() - start_).count();
        auto& e = totals()[name_];
        e.first += us;
        e.second += 1;
    }

    static void report() {
        std::printf("%-16s %12s %8s %12s\\n", "scope", "total us", "calls", "us/call");
        for (const auto& [name, e] : totals())
            std::printf("%-16s %12lld %8lld %12.1f\\n",
                        name.c_str(), e.first, e.second,
                        double(e.first) / double(e.second));
    }

private:
    using Entry = std::pair<long long, long long>;      // total us, call count
    static std::map<std::string, Entry>& totals() {
        static std::map<std::string, Entry> t;
        return t;
    }
    std::string                                    name_;
    std::chrono::steady_clock::time_point          start_;
};

#define TIME_SCOPE(name) ScopeTimer _timer_##__LINE__{name}

void parse()    { TIME_SCOPE("parse");    std::this_thread::sleep_for(std::chrono::milliseconds(2)); }
void transform(){ TIME_SCOPE("transform");std::this_thread::sleep_for(std::chrono::milliseconds(7)); }
void write()    { TIME_SCOPE("write");    std::this_thread::sleep_for(std::chrono::milliseconds(1)); }

int main() {
    {
        TIME_SCOPE("total");
        for (int i = 0; i < 10; ++i) { parse(); transform(); write(); }
    }
    ScopeTimer::report();
}`,
          output: `scope                total us    calls      us/call
parse                   20798       10       2079.8
total                  104822        1     104822.0
transform               70785       10       7078.5
write                   13168       10       1316.8

# transform is 70785/104822 = 68% of total. That is where to look,
# and no profiler was needed to find it.
# (These wrap sleeps, so the exact microseconds move between runs.)`,
          explanation:
            "**A dozen lines find the hot region when you cannot install anything.** The caveats are real — it only measures what you instrument, the timer call itself costs tens of nanoseconds so it is useless on very small functions, and the `static` map is not thread-safe as written. But for a first pass on a program you do not know, adding four `TIME_SCOPE` lines is faster than arguing about where the time goes. **Note the per-call column**: `parse` and `write` differ by 800µs per call, which a total-only view would hide.",
        },
      ],
    },
    {
      id: "interpreting",
      heading: "What to do with the answer",
      body: [
        "**Amdahl's law bounds the payoff.** If a function is 20% of runtime, making it infinitely fast gives you 1.25×. The corollary is worth internalising: **the only changes worth large effort are to code that is a large fraction of the total**, and the profile is what tells you which those are.",
        "**Check whether the workload is representative.** A profile on a 100-element input tells you nothing about the 10-million-element case, because the whole cache story from lesson 2 changes. Profile with production-sized data.",
        "**Look for the shape, not just the top entry.** Time spread evenly across hundreds of functions usually means the problem is architectural — too much copying, too many allocations, a bad data model — and no single change will help. Time concentrated in one function is the good case.",
        "**Allocation is the usual hidden cost.** A profile showing `operator new`, `malloc` or `memmove` high in the list is telling you about copies and temporaries rather than about the allocator. That is lesson 5's subject.",
        "**Re-measure after every change**, and keep the benchmark. An optimisation that stops paying off after a refactor is worse than none, because the complexity remains.",
        "**And know when to stop.** Faster code that nobody notices is a cost, not a benefit — it has to be maintained. The right stopping point is when the profile no longer shows a dominant entry or the target is met.",
      ],
      examples: [
        {
          id: "perf-usage",
          title: "The commands worth knowing",
          lang: "bash",
          code: `# ── Sampling profile: where does the time go? ────────────────────
$ g++ -O2 -g -fno-omit-frame-pointer app.cpp -o app   # -g even in release
$ perf record -g ./app
$ perf report --stdio --sort=self

#   Overhead  Command  Shared Object  Symbol
#     41.23%  app      app            [.] transform(std::vector<double>&)
#     18.07%  app      libc.so.6      [.] __memmove_avx_unaligned
#     11.55%  app      libstdc++.so   [.] operator new(unsigned long)
#      ^ 30% in memmove and new means COPIES, not a slow algorithm


# ── Why is it slow? Hardware counters. ───────────────────────────
$ perf stat -e cycles,instructions,cache-references,cache-misses,\\
             branch-misses ./app

#   12,884,901,888  cycles
#    9,663,676,416  instructions   #  0.75  insn per cycle   <- LOW
#      402,653,184  cache-references
#      201,326,592  cache-misses   # 50.00% of all refs      <- BAD
#       12,582,912  branch-misses
#
#   IPC below ~1 with a high miss rate = memory bound. Lesson 2 applies:
#   fix the layout, not the arithmetic.


# ── Which lines? ─────────────────────────────────────────────────
$ perf annotate transform          # per-instruction, with source


# ── Flame graph, for shape rather than a ranked list ─────────────
$ perf record -g ./app && perf script | stackcollapse-perf.pl \\
      | flamegraph.pl > out.svg


# ── Allocation profiling, when 'new' is high ─────────────────────
$ valgrind --tool=massif ./app     # heap over time
$ heaptrack ./app                  # allocation counts and sites


# ── No profiler available? ───────────────────────────────────────
#   gdb, interrupted a few times during a slow run, is a
#   poor-man's sampling profiler: whatever you keep landing in
#   is where the time is. Crude, and often enough.`,
          output: `# The two lines to read first in any profile:
#
#   1. Is one entry dominant?     -> optimise it
#      Is time spread thin?       -> the problem is architectural
#
#   2. Is IPC low and are misses high?  -> memory bound (lesson 2)
#      Is IPC high?                     -> genuinely compute bound`,
          explanation:
            "**`perf stat` is the underused one.** A ranked list says *where*; instructions-per-cycle and cache-miss rate say *why*. An IPC below about 1 with a high miss rate means the core is stalled waiting for memory — and in that state, removing arithmetic changes nothing while improving layout changes everything, exactly as lesson 2 measured. A high IPC with few misses means you are genuinely compute bound and the constant factor is worth attacking. **These two measurements point at completely different fixes.**",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why can't you optimise from intuition?",
      answer:
        "Because the relationship between source and runtime is not something intuition tracks. Out-of-order execution, branch prediction, several cache levels, prefetchers and SIMD on the hardware side; inlining, vectorisation, constant folding and dead-code elimination on the compiler side. The failure mode is not merely wasted effort on the wrong 3% — it is actively making the code worse, since a hand-rolled replacement often defeats an optimisation the compiler was already applying. Profile to decide what to work on, benchmark to decide whether a change helped, and do the profiling first: a well-measured benchmark of a function that is 0.4% of runtime is a well-measured irrelevance.",
    },
    {
      question: "What is the most common microbenchmark trap?",
      answer:
        "Letting the compiler delete the work. If a computed result is never observed, the loop producing it is dead code and is removed — measured here, a loop of a million square roots reported 1.14 ms when discarded and 8.36 ms with a `DoNotOptimize` barrier, so the naive benchmark claims a 7× speedup for work that never happened. The second most common is constant-folding: `sqrt(2.0)` in a loop is computed once at compile time, so the benchmark times the loop counter. Both produce plausible-looking numbers, which is what makes them dangerous.",
    },
    {
      question: "What does `DoNotOptimize` actually do?",
      answer:
        "It tells the compiler that a value must genuinely exist in a register or memory at that point and that something unknowable may observe it, so the computation producing it cannot be eliminated. The typical implementation is an empty `asm volatile` with the value as an input operand and a memory clobber. Google Benchmark provides it as `benchmark::DoNotOptimize`, with `ClobberMemory` as the companion for forcing stores to be visible. Every hand-written microbenchmark needs some version of it, and a suspiciously fast result is usually the sign that it is missing.",
    },
    {
      question: "What is the difference between a sampling and an instrumenting profiler?",
      answer:
        "A sampling profiler periodically interrupts the program and records the stack, so overhead is a few percent and it can run on realistic workloads — `perf`, Instruments, VTune. An instrumenting profiler adds code at every function entry and exit, giving exact call counts but with 10–50× overhead that distorts what it measures: small functions appear disproportionately expensive because the instrumentation cost is per call. Use sampling for timing questions, which is nearly always, and instrumenting when you specifically need exact call counts. Hardware counters via `perf stat` are the third source and answer *why* rather than *where*.",
    },
    {
      question: "How do you read a profile without drawing the wrong conclusion?",
      answer:
        "Separate self time from total time — a function with 90% total and 1% self is not the problem, its callee is. Watch for inlining, which attributes a function's cost to its caller and can make the culprit invisible. Check call counts, since 20% of runtime across ten million calls needs a different fix from 20% in one call. Confirm the workload is representative, because a profile on small input says nothing about the cache behaviour at production scale. And read the shape: time concentrated in one function is the good case, while time spread evenly across hundreds usually means an architectural problem — too much copying or allocation — that no single change will fix.",
    },
    {
      question: "What do instructions-per-cycle and cache-miss rate tell you?",
      answer:
        "They tell you *why* code is slow, which a ranked list of functions does not. An IPC below roughly 1 combined with a high cache-miss rate means the core is stalled waiting for memory — the program is memory bound, and removing arithmetic will change nothing while improving data layout will change everything, which is exactly what lesson 2's stride measurement showed. A high IPC with few misses means you are genuinely compute bound and the constant factor is worth attacking. A high branch-miss rate points at unpredictable control flow. These diagnoses lead to completely different fixes, which is why `perf stat` is worth running before any optimisation work.",
    },
  ],
  takeaways: [
    "Profile to decide what to optimise; benchmark to decide whether a change helped",
    "Optimise algorithm, then data layout, then constant factor — in that order",
    "A discarded result means the loop is deleted: 1.14 ms reported against 8.36 ms real",
    "A constant input is folded at compile time and the benchmark times the loop counter",
    "One operation is far below clock resolution — repeat and divide",
    "`DoNotOptimize` is an `asm volatile` barrier; every microbenchmark needs one",
    "Benchmark at your release optimisation level, never `-O0`",
    "Report a distribution; prefer median or minimum, since noise only adds time",
    "Sampling profilers are low overhead and representative — the default choice",
    "Instrumenting profilers give exact counts and distort timing by 10–50×",
    "Separate self time from total time, and watch for inlining hiding the culprit",
    "Low IPC plus high miss rate means memory bound — fix layout, not arithmetic",
    "`new`, `malloc` and `memmove` high in a profile mean copies, not a slow allocator",
    "Amdahl bounds the payoff: 20% of runtime caps you at 1.25×",
  ],
  status: "available",
};
