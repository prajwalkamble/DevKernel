import type { Lesson } from "@/content/types";

export const cachesLesson: Lesson = {
  id: "cpp-caches",
  slug: "caches-locality-and-data-layout",
  moduleSlug: "performance-systems",
  title: "Caches, Locality & Why Data Layout Beats Clever Code",
  summary:
    "The memory hierarchy measured on real hardware — 3.4ns in L1 rising to 93ns in RAM, with the steps landing exactly where the CPU's cache sizes say they should. Then the layout change that made the same loop 1.7× faster without touching the arithmetic.",
  estimatedMinutes: 40,
  objectives: [
    "State the rough latency of each cache level and why the gap matters",
    "Explain spatial and temporal locality in terms of cache lines",
    "Measure a machine's cache hierarchy yourself",
    "Choose between array-of-structs and struct-of-arrays for a reason",
    "Recognise when layout, not algorithm, is the bottleneck",
  ],
  sections: [
    {
      id: "the-hierarchy",
      heading: "The memory hierarchy, measured",
      body: [
        "A modern CPU can issue several instructions per cycle. A load from main memory takes **hundreds of cycles**. That gap is the single dominant fact about performance on current hardware, and it is why data layout matters more than instruction count for most real code.",
        "Caches close the gap by keeping recently and nearby used data closer to the core. The costs are not a matter of opinion — you can measure them, and the program below does.",
        "It walks a **randomly shuffled pointer chain** of a chosen size. Because each load's address depends on the previous load's *result*, the CPU cannot prefetch or overlap them: every access must complete before the next begins. That turns throughput into **latency**, and the cache hierarchy appears as steps.",
        "The numbers below are from the machine this was written on — an Intel i3-4010U with, according to the OS, **32 KiB of L1d per core, 256 KiB of L2 per core, and 3 MiB of shared L3**.",
      ],
      examples: [
        {
          id: "cache-sweep",
          title: "A pointer chase across the hierarchy",
          lang: "cpp",
          code: `#include <algorithm>
#include <chrono>
#include <cstdio>
#include <numeric>
#include <random>
#include <vector>

using Clock = std::chrono::steady_clock;

// Walk a random permutation cycle of a given working-set size.
// Each load depends on the previous one, so the CPU cannot prefetch:
// this measures LATENCY, and the cache levels show up as steps.
double chaseNs(std::size_t bytes) {
    const std::size_t n = bytes / sizeof(std::size_t);
    std::vector<std::size_t> idx(n);
    std::iota(idx.begin(), idx.end(), 0);
    std::mt19937_64 rng{42};
    std::shuffle(idx.begin() + 1, idx.end(), rng);

    std::vector<std::size_t> next(n);
    for (std::size_t i = 0; i + 1 < n; ++i) next[idx[i]] = idx[i + 1];
    next[idx[n - 1]] = idx[0];

    const std::size_t steps = 20'000'000;
    std::size_t p = 0;
    auto t0 = Clock::now();
    for (std::size_t i = 0; i < steps; ++i) p = next[p];
    auto t1 = Clock::now();
    asm volatile("" :: "r"(p));          // stop the loop being optimised away
    return std::chrono::duration<double, std::nano>(t1 - t0).count() / double(steps);
}

int main() {
    std::printf("%10s  %12s\\n", "working set", "ns / access");
    for (std::size_t kb : {4u, 16u, 32u, 64u, 256u, 512u, 2048u, 4096u, 16384u})
        std::printf("%8zu K  %12.2f\\n", kb, chaseNs(kb * 1024));
}`,
          output: `working set   ns / access
       4 K          3.41     <- L1d  (32 KiB/core)
      16 K          3.30
      32 K          3.41
      64 K          5.53     <- spills out of L1
     256 K         10.37     <- L2   (256 KiB/core)
     512 K         17.44     <- spills out of L2
    2048 K         40.62     <- L3   (3 MiB shared)
    4096 K         60.62     <- exceeds L3
   16384 K         93.18     <- main memory

# 3.41 ns to 93.18 ns is a 27x range, on the same instruction,
# for the same amount of work. Only the working-set size changed.`,
          explanation:
            "**The steps land exactly where `lscpu` says the caches are.** Flat at ~3.4ns through 32 K, which is this core's L1d; a jump at 64 K; flat-ish to 256 K, this core's L2; then a climb through the 3 MiB L3 and out to RAM at 93ns. **27× between the best and worst case for identical code** — that is the budget you are working with, and it is why an algorithm with fewer operations can easily lose to one with better locality.",
        },
      ],
      pitfalls: [
        {
          title: "The `asm volatile` line is not decoration",
          body: "Without it, the compiler observes that `p` is never used after the loop and deletes the entire chase, producing a benchmark that measures nothing and reports impossibly fast times. `asm volatile(\"\" :: \"r\"(p))` tells the compiler that `p` must exist in a register at that point and that something unknowable may have happened, so the loop cannot be removed. Google Benchmark's `benchmark::DoNotOptimize` is the same trick with a nicer name. **Every microbenchmark needs some version of this**, and lesson 4 covers the ways they go wrong.",
        },
      ],
    },
    {
      id: "locality",
      heading: "Cache lines and the two localities",
      body: [
        "**Memory moves between cache and RAM in fixed-size blocks called cache lines — 64 bytes on essentially all current x86 and ARM.** You never fetch one byte; you fetch the line containing it.",
        "That single fact produces both forms of locality.",
        "**Spatial locality**: after touching one byte, the other 63 in that line are effectively free. Iterating an array in order gets 16 `int`s per fetch; iterating with a stride of 64 bytes gets one useful value per fetch and wastes the rest.",
        "**Temporal locality**: data touched recently is likely still resident. Processing an array twice in succession is far cheaper than processing it, doing something else large, and coming back.",
        "**The hardware prefetcher amplifies both**, and it only helps when it can *predict* the pattern. Sequential forward access is predicted perfectly. Fixed strides are usually predicted. **Pointer chasing is not predictable at all**, which is exactly why the benchmark above shuffles its chain — an unshuffled chain would be prefetched and would measure nothing.",
        "This is the real explanation for module 8's measurement that a `std::list` traversal was ten times slower than a `std::vector`: not the pointer indirection itself, but that the indirection defeats prefetching and wastes most of every line fetched.",
      ],
      examples: [
        {
          id: "stride",
          title: "The same number of accesses, different strides",
          lang: "cpp",
          code: `#include <chrono>
#include <cstdio>
#include <vector>

using Clock = std::chrono::steady_clock;

int main() {
    constexpr std::size_t N = 16 * 1024 * 1024;   // 64 MB of ints
    std::vector<int> v(N, 1);

    std::printf("%8s  %10s  %s\\n", "stride", "ms", "note");
    // Each row does HALF the additions of the row above it (N / stride
    // elements), so a compute-bound loop would halve each time.
    for (std::size_t stride : {1u, 2u, 4u, 8u, 16u, 32u, 64u}) {
        auto t0 = Clock::now();
        long long sum = 0;
        for (std::size_t i = 0; i < N; i += stride) sum += v[i];
        auto t1 = Clock::now();
        asm volatile("" :: "r"(sum));
        double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
        const char* note = (stride == 16) ? "<- one int per 64-byte line"
                                          : "";
        std::printf("%8zu  %10.2f  %s\\n", stride, ms, note);
    }
}`,
          output: `  stride          ms  note
       1       16.78
       2       10.27
       4        7.61
       8        7.59
      16        7.24  <- one int per 64-byte line
      32        5.48
      64        3.41

# Each row does HALF the arithmetic of the row above it, so a
# compute-bound program would halve each time. Instead:
#
#   stride 8 -> 16 : half the work, 7.59 ms -> 7.24 ms. Nothing saved.
#   stride 1 -> 16 : ONE SIXTEENTH the work, only 2.3x faster.
#
# All of those runs fetch the SAME NUMBER OF CACHE LINES, because 16
# ints fit in one 64-byte line. Past stride 16 each access finally
# lands in a distinct line, and the times start falling again.`,
          explanation:
            "**Look at stride 8 against stride 16: half the additions, and no time saved at all.** Both fetch every cache line in the array, so the arithmetic was never the cost. Going from stride 1 to stride 16 removes fifteen sixteenths of the work and buys only 2.3×. **This is what \"memory bound\" means concretely** — and it is why optimising instruction count in such a loop achieves nothing. Note the falloff past 16 is real but not proportional either, because at 64 MB the walk is also paying TLB and page-level costs on top of the line fetches.",
        },
      ],
    },
    {
      id: "aos-soa",
      heading: "Array of structs against struct of arrays",
      body: [
        "The most consequential layout decision in data-heavy code, and it follows directly from cache lines.",
        "**Array of structs (AoS)** is the natural way to write it: one `struct Particle` with all its fields, in a `std::vector<Particle>`. Fields belonging to one entity are adjacent.",
        "**Struct of arrays (SoA)** turns it inside out: one array per field. Fields belonging to one *attribute* are adjacent.",
        "**When code touches all fields of one entity, AoS wins** — they share a line. **When code touches one field across many entities, SoA wins**, because AoS drags every other field along for the ride and wastes the line.",
        "The measurement below sums three of eight fields over four million particles. The AoS version fetches **128 MB**; the SoA version fetches **48 MB** for exactly the same arithmetic.",
        "**SoA also vectorises far better**, because the values a SIMD instruction wants are already contiguous, where AoS requires a gather.",
        "**The costs are real**: SoA is more awkward to write, you lose the ability to pass \"a particle\" as one object, and inserting or removing an entity means touching every array. It is a decision for hot data-parallel loops, not a default.",
      ],
      examples: [
        {
          id: "aos-vs-soa",
          title: "1.7× faster with identical arithmetic",
          lang: "cpp",
          code: `#include <chrono>
#include <cstdio>
#include <vector>

using Clock = std::chrono::steady_clock;
template <typename F> double ms(F f) {
    auto t0 = Clock::now(); f();
    return std::chrono::duration<double, std::milli>(Clock::now() - t0).count();
}

constexpr std::size_t N = 4'000'000;

// Fields interleaved: touching x drags vx, vy, vz, id and alive with it.
struct ParticleAoS { float x, y, z, vx, vy, vz; int id; bool alive; };

// Each field contiguous: touching x touches only x.
struct ParticlesSoA {
    std::vector<float> x, y, z, vx, vy, vz;
    std::vector<int>   id;
    std::vector<char>  alive;
};

int main() {
    std::printf("sizeof(ParticleAoS) = %zu bytes\\n", sizeof(ParticleAoS));
    std::printf("AoS total          = %.1f MB\\n", double(N * sizeof(ParticleAoS)) / 1e6);
    std::printf("SoA x+y+z only     = %.1f MB\\n\\n", double(N * 3 * sizeof(float)) / 1e6);

    std::vector<ParticleAoS> aos(N);
    ParticlesSoA soa;
    soa.x.resize(N); soa.y.resize(N); soa.z.resize(N);
    soa.vx.resize(N); soa.vy.resize(N); soa.vz.resize(N);
    soa.id.resize(N); soa.alive.resize(N);
    for (std::size_t i = 0; i < N; ++i) {
        aos[i].x = soa.x[i] = float(i);
        aos[i].y = soa.y[i] = float(i) * 2;
        aos[i].z = soa.z[i] = float(i) * 3;
    }

    volatile double sink = 0;
    double a = ms([&]{ double s = 0; for (auto& p : aos) s += p.x + p.y + p.z; sink = s; });
    double b = ms([&]{ double s = 0;
                       for (std::size_t i = 0; i < N; ++i)
                           s += soa.x[i] + soa.y[i] + soa.z[i];
                       sink = s; });
    std::printf("sum x+y+z over %zu particles, 1 pass:\\n", N);
    std::printf("  AoS : %7.1f ms\\n", a);
    std::printf("  SoA : %7.1f ms\\n", b);
    (void)sink;
}`,
          output: `sizeof(ParticleAoS) = 32 bytes
AoS total          = 128.0 MB
SoA x+y+z only     = 48.0 MB

sum x+y+z over 4000000 particles, 1 pass:
  AoS :    14.6 ms
  SoA :     8.7 ms

# three consecutive runs: AoS 14.6 / 16.9 / 15.1, SoA 8.7 / 12.0 / 8.8
# -- consistently around 1.7x, on the same additions.`,
          explanation:
            "**Identical arithmetic, 1.7× difference, and the ratio follows the byte counts.** The AoS loop reads 128 MB because every 64-byte line it fetches contains twelve bytes it wants and twenty it does not; the SoA loop reads 48 MB and uses all of it. Note this is a *conservative* demonstration — the struct here is only 32 bytes. Widen it to 64 or 128 bytes, which real entity structs routinely are, and the gap grows accordingly. **The compiler cannot do this transformation for you**; layout is your decision.",
        },
      ],
      pitfalls: [
        {
          title: "Measure before restructuring — SoA is a real maintainability cost",
          body: "SoA makes the code harder to read, breaks the ability to pass one entity as a single object, complicates insertion and deletion, and makes it easy to desynchronise arrays if any operation updates one and not the others. It pays off in hot loops over large collections touching a subset of fields — particle systems, ECS game engines, columnar analytics — and is pure cost everywhere else. The middle path worth knowing is **hot/cold splitting**: keep the frequently accessed fields in the main struct and move the rarely used ones behind a pointer, which recovers much of the benefit with far less disruption.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does data layout matter more than instruction count on modern hardware?",
      answer:
        "Because the gap between compute and memory is enormous. A core issues several instructions per cycle while a main-memory load takes hundreds of cycles. Measured with a dependent pointer chase on an i3-4010U: 3.41 ns per access with a working set inside L1, rising to 93.18 ns from RAM — a 27× range for the identical instruction, with only the working-set size changing. A strided sum makes the same point from the other direction: halving the arithmetic by moving from stride 8 to stride 16 saved nothing at all, 7.59 ms against 7.24 ms, because both fetch every cache line. So an algorithm doing fewer operations can easily lose to one with better locality.",
    },
    {
      question: "What is a cache line and why does it produce spatial locality?",
      answer:
        "The fixed-size block memory moves in between cache and RAM — 64 bytes on essentially all current x86 and ARM. You never fetch a single byte; you fetch the line containing it. So after touching one byte the other 63 are effectively free, which is what makes sequential iteration fast. Measured with a strided sum over 64 MB: moving from stride 8 to stride 16 halves the arithmetic and saves nothing — 7.59 ms against 7.24 ms — because 16 `int`s fit in one line, so both runs fetch every line in the array. Going from stride 1 to stride 16 removes fifteen sixteenths of the work for only a 2.3× speedup. Past stride 16 each access lands in a distinct line and the times start falling again.",
    },
    {
      question: "Why does a pointer chase measure latency rather than throughput?",
      answer:
        "Because each load's address comes from the previous load's result, so the CPU cannot start the next access until the current one has completed — no overlapping, and the hardware prefetcher cannot predict where to go next. That serialises the accesses and exposes the true latency of each cache level. It is also why the chain must be randomly shuffled: a sequential chain would be predicted perfectly by the prefetcher and would measure prefetch bandwidth instead. The same mechanism explains why a linked-list traversal is roughly ten times slower than a vector traversal.",
    },
    {
      question: "When would you choose struct-of-arrays over array-of-structs?",
      answer:
        "When hot loops touch a small subset of fields across many entities. AoS keeps one entity's fields adjacent, which wins when code uses all of them together; SoA keeps one field's values adjacent, which wins when code uses one field across everything — because AoS drags the unused fields into cache and wastes most of each line. Measured summing three of eight fields over four million particles: AoS read 128 MB and took ~15 ms, SoA read 48 MB and took ~8.7 ms, about 1.7× for identical arithmetic. SoA also vectorises better since SIMD wants contiguous values. The costs are readability, losing \"a particle\" as an object, and desynchronisation risk.",
    },
    {
      question: "What is hot/cold splitting?",
      answer:
        "Keeping frequently accessed fields in the main struct and moving rarely used ones behind a pointer or into a side table. It recovers much of SoA's benefit — the hot fields pack more densely, so more entities fit per cache line — without the full disruption of turning the data model inside out. It suits objects with a few fields used in every loop and many used only on rare paths, such as error details or debug metadata. It is the middle option between AoS and SoA, and usually the first thing to try when profiling says a structure is too wide.",
    },
    {
      question: "Why does a microbenchmark need something like `asm volatile(\"\" :: \"r\"(x))`?",
      answer:
        "Because otherwise the compiler observes that the computed value is never used, deletes the entire loop, and the benchmark reports an impossibly fast time for work that never happened. That construct tells the compiler the value must exist in a register at that point and that something unknowable may occur, so the computation cannot be removed. Google Benchmark packages the same trick as `benchmark::DoNotOptimize`, with `ClobberMemory` as the companion for stores. Every microbenchmark needs some form of it, and a suspiciously fast result is the usual sign it is missing.",
    },
  ],
  takeaways: [
    "The compute-to-memory gap is the dominant performance fact on current hardware",
    "Measured: 3.4 ns per access in L1 rising to 93 ns from RAM — a 27× range",
    "The measured steps land exactly at this CPU's 32 K L1d, 256 K L2 and 3 MiB L3",
    "Memory moves in 64-byte cache lines — you never fetch one byte",
    "Spatial locality: the other 63 bytes are free. Temporal: recent data is still resident",
    "Stride 8 to 16 halves the arithmetic and saves nothing — both fetch every line",
    "The prefetcher only helps when it can predict — pointer chasing defeats it",
    "AoS keeps one entity's fields together; SoA keeps one field's values together",
    "Summing 3 of 8 fields: AoS read 128 MB, SoA read 48 MB, for a 1.7× difference",
    "SoA also vectorises better, since SIMD wants contiguous values",
    "SoA costs readability and risks desynchronised arrays — measure first",
    "Hot/cold splitting is the cheaper middle path",
    "Every microbenchmark needs a `DoNotOptimize`-style barrier or it measures nothing",
  ],
  status: "available",
};
