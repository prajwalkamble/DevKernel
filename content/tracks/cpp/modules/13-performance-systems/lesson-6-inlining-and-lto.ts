import type { Lesson } from "@/content/types";

export const inliningLesson: Lesson = {
  id: "cpp-inlining-lto",
  slug: "inlining-lto-and-reading-assembly",
  moduleSlug: "performance-systems",
  title: "Inlining, Link-Time Optimisation & Reading the Generated Assembly",
  summary:
    "Why inlining is the optimisation that enables the others, and what happens when a call crosses a translation unit. A 200-million-iteration loop measured at 665ms without LTO and 0.0ms with it — because inlining let the optimiser delete the loop entirely.",
  estimatedMinutes: 35,
  objectives: [
    "Explain why inlining matters beyond removing the call overhead",
    "Say what `inline` actually means and what it does not",
    "Use LTO and explain what it enables",
    "Read generated assembly to confirm what the compiler did",
    "Recognise when inlining hurts",
  ],
  sections: [
    {
      id: "why-inlining",
      heading: "Inlining is an enabling optimisation",
      body: [
        "The call overhead itself is small — push arguments, jump, return, a handful of cycles. **That is not why inlining matters.**",
        "**Inlining matters because it exposes the callee's body to the caller's context**, and every other optimisation can then apply across what used to be a boundary. Constants propagate into the body. Dead branches on those constants disappear. Loads get hoisted because the compiler can now see nothing writes to them. Loops fuse or vanish. The result is frequently far larger than the call cost.",
        "The measurement below shows the effect at its most extreme. A trivial `addOne(x)` called 300 million times: **768.7ms when marked `noinline`, and 0.0ms when the compiler is allowed to inline it** — because once inlined, GCC recognised the loop computes a closed-form sum and eliminated the loop entirely.",
        "**That is the shape of the win**: not \"the call got cheaper\" but \"the call stopped existing, and then the surrounding code collapsed.\"",
        "**The compiler decides, not you.** Modern compilers inline based on size heuristics, call-site frequency, and whether the body is available — and they are usually right. `inline` is not a request.",
      ],
      examples: [
        {
          id: "inline-measured",
          title: "The same function, three inlining outcomes",
          lang: "cpp",
          code: `#include <chrono>
#include <cstdio>

using Clock = std::chrono::steady_clock;

__attribute__((noinline)) int slowPath(int x) { return x * 2 + 1; }
                          int normal(int x)   { return x * 2 + 1; }
__attribute__((always_inline)) inline int forced(int x) { return x * 2 + 1; }

template <typename F> double ms(F f) {
    auto t0 = Clock::now(); f();
    return std::chrono::duration<double, std::milli>(Clock::now() - t0).count();
}

int main() {
    constexpr int N = 300'000'000;
    volatile long long sink = 0;
    double a = ms([&]{ long long s=0; for (int i=0;i<N;++i) s += slowPath(i); sink=s; });
    double b = ms([&]{ long long s=0; for (int i=0;i<N;++i) s += normal(i);   sink=s; });
    double c = ms([&]{ long long s=0; for (int i=0;i<N;++i) s += forced(i);   sink=s; });
    std::printf("noinline      : %7.1f ms\\n", a);
    std::printf("normal        : %7.1f ms\\n", b);
    std::printf("always_inline : %7.1f ms\\n", c);
    (void)sink;
}`,
          output: `noinline      :   768.7 ms
normal        :     0.0 ms
always_inline :     0.0 ms

# The 0.0 ms is not "inlining made the call free". Once the body was
# visible, GCC recognised that the loop computes a closed-form sum and
# deleted the loop. Blocking inlining blocked that entire chain.`,
          explanation:
            "**`noinline` cost 768.7ms; allowing inlining cost nothing measurable.** Read that correctly: the difference is not 300 million call instructions, it is that inlining let the optimiser see the whole computation and replace it with arithmetic. **This is why \"the call overhead is only a few cycles\" is the wrong way to think about inlining** — the call overhead is not the point, the optimisation barrier is.",
        },
      ],
      pitfalls: [
        {
          title: "`inline` is about linkage, not about inlining",
          body: "The `inline` keyword's actual meaning is: this function may be defined in multiple translation units without violating the One Definition Rule, and the linker will keep one copy. That is why it is required for a function defined in a header. It is at most a *hint* about inlining, and compilers largely ignore it as such — a function is inlined based on size, call frequency and whether the body is visible, not because you typed a keyword. Conversely a function *not* marked `inline` is inlined all the time. If you genuinely need to force the decision, the tools are `__attribute__((always_inline))` and `__attribute__((noinline))` — and needing them usually means you should check the profile first.",
        },
      ],
    },
    {
      id: "lto",
      heading: "Link-time optimisation",
      body: [
        "**Inlining requires the body to be visible.** With separate compilation, a call into another translation unit is opaque — the compiler has a declaration and nothing else, so it must emit a real call and assume the function may do anything to memory it can reach.",
        "That is why header-only libraries are fast and why template-heavy code optimises well: the definitions are visible everywhere.",
        "**LTO removes the boundary.** With `-flto`, the compiler emits its intermediate representation into the object files instead of finished machine code, and the *linker* runs the optimiser again across the whole program. Cross-TU inlining, cross-TU constant propagation, whole-program devirtualization and dead-function elimination all become possible.",
        "The measurement below is the same 200-million-iteration loop with `addOne` in a **separate translation unit**: **665.4ms without LTO, 0.0ms with it**, and the disassembly shows exactly why — without LTO there is a `call _Z6addOnei` in the loop body; with LTO the two `steady_clock::now()` calls sit adjacent and the loop is gone.",
        "**The costs are real.** Link time rises substantially, and on large projects it can dominate the build. Debugging gets harder because inlined frames complicate stack traces. And incremental builds suffer, since changing one file can trigger re-optimisation of much more.",
        "**Use it for release builds.** `-flto=auto` parallelises the link on GCC; thin LTO on Clang (`-flto=thin`) is the scalable variant designed for large codebases and incremental builds.",
      ],
      examples: [
        {
          id: "lto-measured",
          title: "A cross-TU call, with and without LTO",
          lang: "bash",
          code: `// ── lib.h ─────────────────────────────────────────────────────────
#pragma once
int addOne(int x);          // declaration only -- body is elsewhere

// ── lib.cpp ───────────────────────────────────────────────────────
#include "lib.h"
int addOne(int x) { return x + 1; }

// ── main.cpp ──────────────────────────────────────────────────────
#include "lib.h"
#include <chrono>
#include <cstdio>
int main() {
    auto t0 = std::chrono::steady_clock::now();
    long long s = 0;
    for (int i = 0; i < 200'000'000; ++i) s += addOne(i);
    auto ms = std::chrono::duration<double, std::milli>(
                  std::chrono::steady_clock::now() - t0).count();
    asm volatile("" :: "r"(s));
    std::printf("%.1f ms   (sum %lld)\\n", ms, s);
}


$ g++ -O2 -c lib.cpp -o lib.o && g++ -O2 -c main.cpp -o main.o
$ g++ -O2 lib.o main.o -o nolto && ./nolto
665.4 ms   (sum 20000000100000000)

$ g++ -O2 -flto -c lib.cpp -o libl.o && g++ -O2 -flto -c main.cpp -o mainl.o
$ g++ -O2 -flto libl.o mainl.o -o withlto && ./withlto
0.0 ms   (sum 20000000100000000)`,
          output: `$ objdump -d -M intel nolto   | sed -n '/<main>:/,/^$/p'
    1068:   call   <steady_clock::now()@plt>
    1072:   add    ebx,0x1
    1075:   call   <addOne(int)>          <- a real call, 200 million times
    107c:   add    rbp,rax
    1085:   jne    <main+0x10>            <- the loop

$ objdump -d -M intel withlto | sed -n '/<main>:/,/^$/p'
    1061:   call   <steady_clock::now()@plt>
    1069:   call   <steady_clock::now()@plt>   <- adjacent: no loop at all
    1098:   call   <printf@plt>

$ size nolto withlto
   text    data     bss     dec     hex filename
   1630     608       8    2246     8c6 nolto
   1555     608       8    2171     87b withlto`,
          explanation:
            "**The two disassemblies are the whole lesson.** Without LTO the loop is right there with a `call` inside it, because `addOne` lives in another object file and the compiler had only a declaration. With LTO the two clock reads are adjacent — the loop was inlined, recognised and deleted, and the sum was computed at compile time. **The sum printed is identical in both cases**, which is how you know the optimisation was legitimate rather than a broken benchmark. Note the `.text` section also *shrank*, which is common: eliminating a function outright often outweighs the duplication inlining causes.",
        },
      ],
    },
    {
      id: "reading-asm",
      heading: "Reading the output",
      body: [
        "You do not need to write assembly to benefit from reading it. **The question is almost always narrow — did the compiler do the thing I expected?** — and answering it takes a minute.",
        "**`-S -masm=intel`** emits assembly for a source file. **`objdump -d -M intel --demangle`** disassembles a finished binary, which is what you want when LTO or the linker is involved. **`-fverbose-asm`** annotates with variable names. **Compiler Explorer** (godbolt.org) is the interactive version and is the right tool for exploring.",
        "**The things worth looking for**, in rough order of usefulness:",
        "**Is there a `call` where you expected inlining?** That is the single most common thing to check, and the LTO example above is exactly it.",
        "**Are there SIMD registers — `xmm`, `ymm`, `zmm`?** Their absence in a loop over floats means vectorisation did not happen, and `-fopt-info-vec-missed` will tell you why.",
        "**How many instructions are in the loop body?** Between the label and the backward jump. If it is far more than the arithmetic requires, something is being reloaded that you thought was in a register.",
        "**Is there a `div`?** Integer division is 20–40 cycles. Seeing one where you expected a shift usually means signedness, as lesson 1 showed.",
        "**Are there unexpected calls to `memcpy`, `memmove` or `operator new`?** Those are copies you did not intend.",
      ],
      examples: [
        {
          id: "asm-checks",
          title: "Four questions answered from the assembly",
          lang: "bash",
          code: `# ── 1. Did it vectorise? ─────────────────────────────────────────
void scale(float* a, int n) { for (int i = 0; i < n; ++i) a[i] *= 2.0f; }

$ g++ -O3 -S -masm=intel scale.cpp
.L4:
        movups  xmm0, XMMWORD PTR [rax]      <- SIMD: 4 floats at a time
        addps   xmm0, xmm0
        movups  XMMWORD PTR -16[rax], xmm0
        jne     .L4

# Why did a loop NOT vectorise?
$ g++ -O3 -fopt-info-vec-missed scale.cpp
#   note: couldn't vectorize loop
#   note: not vectorized: loop contains function calls or data references
#         that cannot be analyzed


# ── 2. Is a virtual call being devirtualized? ────────────────────
# (module 6 lesson 2 measured this)
int viaBase(const Shape& s)  { return s.area(); }
        mov     rax, QWORD PTR [rdi]         <- load vptr
        jmp     [QWORD PTR 16[rax]]          <- indirect: NOT devirtualized

struct Square final : Shape { ... };
int viaFinal(const Square& s) { return s.area(); }
        jmp     Square::area() const         <- direct: 'final' did it


# ── 3. Is there hidden division? ─────────────────────────────────
int perCent(int total, int n) { return total / n; }
        mov     eax, edi
        cdq
        idiv    esi                          <- 20-40 cycles

int perCent100(int total)     { return total / 100; }
        movsx   rax, edi
        sar     edi, 31
        imul    rax, rax, 1374389535         <- magic-number multiply
        sar     rax, 37
        sub     eax, edi                     <- no division at all


# ── 4. Are there copies you did not ask for? ─────────────────────
$ objdump -d --demangle app | grep -cE "call.*(memcpy|memmove|operator new)"
#   a high count in a hot function means temporaries -- check for
#   pass-by-value, returned containers, or a missing std::move.`,
          output: `# The single most useful habit: after making a change for performance,
# look at the assembly and confirm the compiler did what you intended.
# It takes a minute and it is the difference between "I optimised this"
# and "I measured that this is faster".`,
          explanation:
            "**Question 2 is the one that pays off most often in real code.** A virtual call that you assumed was devirtualized usually is not, because a reference to a non-final class could refer to something further derived — module 6 measured exactly this, and adding `final` collapsed the indirect jump into a direct one. Question 3 is worth knowing because a division by a runtime value is genuinely expensive and a division by a constant is not: the compiler replaces it with a multiply and shift.",
        },
      ],
      pitfalls: [
        {
          title: "Inlining is not free, and more is not better",
          body: "Every inlined copy adds instructions to the caller, and instruction cache is a limited resource — a hot loop whose body no longer fits in L1i can be dramatically slower even though every individual call got cheaper. Aggressive inlining also inflates binary size, which costs page faults and startup time, and it lengthens compile times. GCC's `-finline-limit` and the `always_inline` attribute exist for the rare cases where you know better than the heuristic, and reaching for them without a profile is how people make code slower while believing they optimised it. The compiler's defaults are tuned on large bodies of real code; beat them with measurement, not conviction.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does inlining matter, given that a function call is only a few cycles?",
      answer:
        "Because the call overhead is not the point — the optimisation barrier is. Inlining exposes the callee's body to the caller's context, so constants propagate in, branches on those constants become dead, loads get hoisted because the compiler can now prove nothing writes to them, and loops can fuse or vanish. Measured with a trivial `x * 2 + 1` called 300 million times: 768.7 ms when marked `noinline`, and 0.0 ms when inlining was allowed — because once the body was visible GCC recognised the loop computed a closed-form sum and deleted the loop. The win was not 300 million cheaper calls; it was the entire computation collapsing.",
    },
    {
      question: "What does the `inline` keyword actually mean?",
      answer:
        "That the function may be defined in several translation units without violating the One Definition Rule, and the linker will keep one copy — which is why it is required for a function defined in a header. It is at most a hint about actual inlining, and compilers largely ignore it as such: the decision is made on body size, call-site frequency and whether the definition is visible. Functions without `inline` are inlined constantly, and functions with it often are not. To genuinely force the decision you need `__attribute__((always_inline))` or `__attribute__((noinline))`, and needing them usually means checking the profile first.",
    },
    {
      question: "What is LTO and what does it enable?",
      answer:
        "Link-time optimisation. With `-flto` the compiler writes its intermediate representation into object files rather than finished machine code, and the linker runs the optimiser again across the whole program — so cross-translation-unit inlining, constant propagation, devirtualization and dead-function elimination all become possible. Measured on a 200-million-iteration loop calling a function in another TU: 665.4 ms without LTO, with a real `call` visible in the disassembled loop, and 0.0 ms with LTO, where the loop had been inlined and eliminated entirely. The `.text` section also shrank, from 1630 to 1555 bytes, since removing a function outweighed the inlining.",
    },
    {
      question: "What does LTO cost?",
      answer:
        "Link time, primarily — the optimiser runs again over the whole program at link, and on large projects that can dominate the build. Incremental builds suffer for the same reason: changing one file can trigger re-optimisation of far more than that file. Debugging gets harder because inlined frames complicate stack traces and variables may not exist as the source describes them. The mitigations are `-flto=auto` on GCC to parallelise the link, and Clang's thin LTO (`-flto=thin`), which is designed for large codebases and keeps incremental builds practical. Enable it for release builds, not for the edit-compile-debug loop.",
    },
    {
      question: "What do you look for when reading generated assembly?",
      answer:
        "The question is usually narrow — did the compiler do what I expected? Is there a `call` where inlining should have happened, which is the commonest thing to check. Are there `xmm`/`ymm` registers in a float loop, and if not, `-fopt-info-vec-missed` explains why. How many instructions are in the loop body between the label and the backward jump — far more than the arithmetic needs means something is being reloaded. Is there an `idiv`, which costs 20–40 cycles, where you expected a shift. And are there unexpected calls to `memcpy`, `memmove` or `operator new`, which mean copies you did not intend.",
    },
    {
      question: "When does inlining make things slower?",
      answer:
        "When it inflates the instruction footprint past what the instruction cache holds. Every inlined copy adds instructions to the caller, so a hot loop whose body no longer fits in L1i can be substantially slower even though each individual call became cheaper. It also grows the binary, costing page faults and startup time, and it lengthens compile times. This is why the compiler uses size heuristics rather than inlining everything, and why forcing `always_inline` without a profile is a common way to make code slower while believing you optimised it.",
    },
  ],
  takeaways: [
    "Inlining matters because it removes an optimisation barrier, not because calls are expensive",
    "Measured: 768.7 ms with `noinline`, 0.0 ms when inlining let the loop be eliminated",
    "`inline` means \"may be defined in multiple TUs\" — it is barely a hint about inlining",
    "A cross-TU call is opaque: the compiler has a declaration and must emit a real call",
    "LTO moves optimisation to link time, enabling cross-TU inlining and devirtualization",
    "Measured: 665.4 ms without LTO against 0.0 ms with it, for the identical program",
    "The disassembly shows it: a `call` in the loop without LTO, no loop at all with it",
    "LTO can shrink the binary — eliminating functions outweighs inlining duplication",
    "LTO costs link time and hurts incremental builds; use `-flto=auto` or Clang's thin LTO",
    "Check the assembly for: an unexpected `call`, missing SIMD registers, `idiv`, or `memcpy`",
    "A division by a runtime value is 20–40 cycles; by a constant it is a multiply and shift",
    "More inlining is not better — instruction cache is finite",
  ],
  status: "available",
};
