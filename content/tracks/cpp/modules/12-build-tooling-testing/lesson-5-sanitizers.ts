import type { Lesson } from "@/content/types";

export const sanitizersLesson: Lesson = {
  id: "cpp-sanitizers",
  slug: "sanitizers-address-undefined-and-thread",
  moduleSlug: "build-tooling-testing",
  title: "Sanitizers: Address, Undefined Behaviour & Thread",
  summary:
    "The tools that turn undefined behaviour into a diagnostic. What each sanitizer instruments, what it costs, which pairs are mutually exclusive, and the real reports for a heap overflow, a signed overflow and a data race.",
  estimatedMinutes: 35,
  objectives: [
    "Say what ASan, UBSan, TSan, MSan and LSan each detect",
    "Read each one's report and locate the bug",
    "State the runtime and memory cost of each",
    "Know which sanitizers cannot be combined",
    "Wire sanitizers into a build and CI properly",
  ],
  sections: [
    {
      id: "the-idea",
      heading: "Making undefined behaviour observable",
      body: [
        "Every module so far has produced undefined behaviour that *appeared to work*: the double free in module 5, the missing virtual destructor in module 6, the data race in module 11 that gave the correct answer at `-O2`. The common thread is that testing does not find these, because the symptom depends on the compiler, the optimisation level and the timing.",
        "**Sanitizers instrument the program so the violation itself is detected, rather than its eventual symptom.** They are compiler features — `-fsanitize=...` — not external tools, so they see exactly what the compiler saw.",
        "**AddressSanitizer (ASan)** — memory errors: heap and stack buffer overflow, use-after-free, use-after-return, use-after-scope, double free, memory leaks (via LeakSanitizer, on by default on Linux). Cost: roughly **2× slower, 3× more memory**.",
        "**UndefinedBehaviorSanitizer (UBSan)** — signed integer overflow, invalid shifts, null dereference, misaligned access, invalid enum and bool values, bad casts, array bounds where the size is known. Cost: **negligible**, often under 20%.",
        "**ThreadSanitizer (TSan)** — data races and lock-order inversions, by maintaining a happens-before graph. Cost: **5–15× slower, 5–10× more memory**.",
        "**MemorySanitizer (MSan)** — reads of uninitialised memory. Clang only, and it requires *every* library including the standard library to be instrumented, which makes it much harder to deploy.",
        "**They complement rather than replace static analysis**: a sanitizer only sees code that actually runs, so coverage is whatever your tests exercise.",
      ],
      examples: [
        {
          id: "asan-ubsan",
          title: "Real reports from ASan and UBSan",
          lang: "bash",
          code: `// ── asan.cpp ─────────────────────────────────────────────────────
#include <iostream>
int main() {
    int* arr = new int[10];
    arr[10] = 1;                 // heap-buffer-overflow: one past the end
    std::cout << arr[0] << '\\n';
    delete[] arr;
}

$ g++ -std=c++20 -fsanitize=address -g asan.cpp && ./a.out

=================================================================
==499141==ERROR: AddressSanitizer: heap-buffer-overflow on address
0x504000000038 at pc 0x5615c19dd21e bp 0x7ffc4f55e460 sp 0x7ffc4f55e458
WRITE of size 4 at 0x504000000038 thread T0
    #0 0x5615c19dd21d in main asan.cpp:5
    #1 0x7f9033a35ca7 in __libc_start_call_main
    #2 0x5615c19dd100 in _start


// ── ubsan.cpp ────────────────────────────────────────────────────
#include <climits>
#include <iostream>
int main() {
    int a = INT_MAX;
    int b = a + 1;               // signed integer overflow
    int arr[4]{};
    int i = 5;
    std::cout << b << ' ' << arr[i] << '\\n';   // out-of-bounds index
}

$ g++ -std=c++20 -fsanitize=undefined -g ubsan.cpp && ./a.out

ubsan.cpp:5:10: runtime error: signed integer overflow: 2147483647 + 1
                cannot be represented in type 'int'
ubsan.cpp:8:35: runtime error: index 5 out of bounds for type 'int [4]'
ubsan.cpp:8:40: runtime error: load of address 0x7ffe0ca00ea4 with
                insufficient space for an object of type 'int'`,
          output: `# Two things worth noticing:
#
# 1. ASan gives you the exact line, the access size, and whether it was a
#    read or a write. "WRITE of size 4 at ... in main asan.cpp:5" is the
#    whole diagnosis.
#
# 2. UBSan by default REPORTS AND CONTINUES -- both errors printed, and
#    the program ran to completion. Add -fno-sanitize-recover=all to make
#    the first one abort, which is what you want in CI.`,
          explanation:
            "**UBSan's default of reporting and continuing is the detail that catches people in CI.** A test suite can emit fifty `runtime error:` lines and still exit 0, so the build passes and nobody looks. `-fno-sanitize-recover=all` turns each into an immediate abort with a non-zero exit, which is the only configuration that fails a pipeline. ASan aborts on the first error by default, which is why it needs no equivalent flag.",
        },
      ],
    },
    {
      id: "tsan",
      heading: "ThreadSanitizer",
      body: [
        "TSan deserves separate treatment because it detects something the others cannot: **a bug that is not a wrong value but a missing ordering relationship.**",
        "It maintains a happens-before graph — the relation from module 11 lesson 7 — and reports a race when two threads access the same location without one, where at least one access is a write. **It is checking the definition, not sampling for bad luck**, which is why it caught the race in the `-O2` build that printed the correct answer.",
        "**It also detects lock-order inversions**, reporting a potential deadlock even when the threads did not actually deadlock in that run — which is far more useful than waiting for a hang in production.",
        "**Its costs are the highest of the three**: 5–15× runtime and 5–10× memory. It is a test-suite tool.",
        "**Its coverage limitation is the important caveat.** TSan only observes accesses that executed, so a race on a branch your tests never take goes unreported. A clean run is not proof of absence. It has essentially no false positives, though, so **every report is a real bug**.",
        "**And it cannot see insufficient ordering** — code using `relaxed` where it needed `acquire`/`release` is not a data race, so TSan is silent. That class of bug needs reasoning, as module 11 concluded.",
      ],
      examples: [
        {
          id: "tsan-report",
          title: "A data race report, from a build that produced the right answer",
          lang: "bash",
          code: `// race.cpp -- four threads incrementing an unsynchronised int
#include <thread>
#include <vector>
int plain = 0;
int main() {
    std::vector<std::jthread> ts;
    for (int i = 0; i < 4; ++i)
        ts.emplace_back([]{ for (int j = 0; j < 100000; ++j) ++plain; });
}

$ g++ -std=c++20 -O2 -pthread race.cpp && ./a.out
# prints 400000 -- the CORRECT answer, every time.
# The optimiser turned the loop into a single 'add plain, 100000'.

$ g++ -std=c++20 -fsanitize=thread -g -pthread race.cpp && ./a.out

WARNING: ThreadSanitizer: data race (pid=91964)
  Read of size 4 at 0x56503b418294 by thread T2:
    #0 operator() race.cpp:8
    #1 __invoke_impl<...> /usr/include/c++/14/bits/invoke.h:61
    #2 _M_invoke<0>     /usr/include/c++/14/bits/std_thread.h:301

  Previous write of size 4 at 0x56503b418294 by thread T1:
    #0 operator() race.cpp:8
    #1 __invoke_impl<...> /usr/include/c++/14/bits/invoke.h:61

  Location is global 'plain' of size 4 at 0x56503b418294

  Thread T2 (tid=91968, running) created by main thread at:
    #0 pthread_create

SUMMARY: ThreadSanitizer: data race race.cpp:8 in operator()`,
          output: `# Read the report in four steps:
#   1. kind of access    -> "Read of size 4"
#   2. which thread      -> "by thread T2"
#   3. conflicting with  -> "Previous write ... by thread T1"
#   4. which object      -> "Location is global 'plain'"
#
# Ignore the __invoke_impl / _M_invoke frames -- that is the standard
# library's thread-launch machinery and appears in every report.`,
          explanation:
            "**The unsanitised `-O2` build printed 400000 every time and is still undefined behaviour.** That gap between \"passes tests\" and \"is correct\" is the entire argument for TSan: it reports the missing happens-before edge regardless of whether the timing happened to produce a visible symptom. Both stack traces point at the same line — the `++plain` inside the lambda racing with itself across threads, which is the commonest shape.",
        },
      ],
    },
    {
      id: "using-them",
      heading: "Using them properly",
      body: [
        "**ASan and TSan cannot be combined** — both need to own the memory layout, and the compiler rejects it. **ASan and UBSan can and should be**: `-fsanitize=address,undefined` is the standard development build. **TSan and UBSan** can also be combined.",
        "**So run two CI jobs**: one ASan+UBSan, one TSan. Anything else and you are choosing which bugs to not find.",
        "**Always compile with `-g` and `-fno-omit-frame-pointer`**, or the stack traces are useless. Use `-O1`: unoptimised builds are slow enough that the sanitizer overhead becomes painful, and `-O2` can optimise away the very code you want checked.",
        "**Suppression files** handle third-party noise you cannot fix — `ASAN_OPTIONS=suppressions=...`, `LSAN_OPTIONS`, `TSAN_OPTIONS`. Use them sparingly and review them: a suppression is a bug you have decided not to fix.",
        "**Sanitizers are development and CI tools, never production.** Beyond the performance, ASan's shadow memory and predictable allocator layout are a security liability — Google's guidance is explicit that ASan is not a hardening mechanism. For production hardening use `_FORTIFY_SOURCE=3`, stack protectors, and Control Flow Integrity.",
        "**The one exception worth knowing** is `-fsanitize=undefined` with `-fsanitize-minimal-runtime` and `-fsanitize-trap`, which turns UB into an immediate trap with almost no overhead and no diagnostic — genuinely usable in production as a fail-fast mechanism.",
      ],
      examples: [
        {
          id: "ci-setup",
          title: "Sanitizers in CMake and CI",
          lang: "bash",
          code: `# ── CMake : an option, not a hardcoded flag ──────────────────────
option(ENABLE_SANITIZERS "Build with ASan + UBSan" OFF)
option(ENABLE_TSAN       "Build with ThreadSanitizer" OFF)

if(ENABLE_SANITIZERS AND ENABLE_TSAN)
    message(FATAL_ERROR "ASan and TSan are mutually exclusive")
endif()

if(ENABLE_SANITIZERS)
    add_compile_options(-fsanitize=address,undefined
                        -fno-sanitize-recover=all     # abort, do not continue
                        -fno-omit-frame-pointer -g -O1)
    add_link_options(-fsanitize=address,undefined)
endif()

if(ENABLE_TSAN)
    add_compile_options(-fsanitize=thread
                        -fno-omit-frame-pointer -g -O1)
    add_link_options(-fsanitize=thread)
endif()


# ── .github/workflows/ci.yml ─────────────────────────────────────
jobs:
  sanitizers:
    strategy:
      fail-fast: false
      matrix:
        san: [asan-ubsan, tsan]      # two jobs, because they conflict
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Configure
        run: |
          if [ "\${{ matrix.san }}" = "tsan" ]; then
            cmake -S . -B build -G Ninja -DENABLE_TSAN=ON
          else
            cmake -S . -B build -G Ninja -DENABLE_SANITIZERS=ON
          fi
      - run: cmake --build build
      - name: Test
        env:
          ASAN_OPTIONS: detect_leaks=1:abort_on_error=1:strict_string_checks=1
          UBSAN_OPTIONS: print_stacktrace=1:halt_on_error=1
          TSAN_OPTIONS: halt_on_error=1:second_deadlock_stack=1
        run: ctest --test-dir build --output-on-failure


# ── Useful runtime options ───────────────────────────────────────
# ASAN_OPTIONS=detect_stack_use_after_return=1   # off by default, worth it
# ASAN_OPTIONS=detect_leaks=0                    # LSan is on by default
# ASAN_OPTIONS=suppressions=asan.supp
# TSAN_OPTIONS=history_size=7                    # deeper stacks, more memory
# UBSAN_OPTIONS=print_stacktrace=1               # OFF by default -- turn it on`,
          output: `# The three settings people most often miss:
#
#   -fno-sanitize-recover=all      UBSan otherwise reports and CONTINUES,
#                                  so CI passes with errors in the log
#   UBSAN_OPTIONS=print_stacktrace=1
#                                  UBSan otherwise gives you a line, no stack
#   detect_stack_use_after_return=1
#                                  ASan otherwise misses a whole bug class`,
          explanation:
            "**The `FATAL_ERROR` guard is worth the three lines**, because combining ASan and TSan produces a confusing compiler error rather than an obvious one. The CI matrix runs both configurations as separate jobs with `fail-fast: false`, so a TSan failure does not mask an ASan failure. And note `-O1` rather than `-O0`: a sanitized unoptimised build can be slow enough that people stop running it, which is the real failure mode.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does each sanitizer detect, and what does it cost?",
      answer:
        "AddressSanitizer catches heap and stack buffer overflows, use-after-free, use-after-return and scope, double frees, and — via LeakSanitizer — leaks, at roughly 2× runtime and 3× memory. UndefinedBehaviorSanitizer catches signed overflow, invalid shifts, null dereference, misaligned access, invalid enum and bool values and bad casts, at negligible cost, often under 20%. ThreadSanitizer catches data races and lock-order inversions by maintaining a happens-before graph, at 5–15× runtime and 5–10× memory. MemorySanitizer catches reads of uninitialised memory but is Clang-only and requires every library including the standard library to be instrumented.",
    },
    {
      question: "Why can a sanitizer find bugs that testing cannot?",
      answer:
        "Because it checks the *definition* of the error rather than sampling for a visible symptom. A data race is defined as two unordered conflicting accesses, and TSan detects exactly that — so it reported a race in a `-O2` build that printed the correct answer four hundred thousand times, because the optimiser had collapsed the loop into a single instruction and closed the timing window. Similarly ASan detects a one-past-the-end write immediately, rather than waiting for the corrupted heap to cause a crash somewhere unrelated. The symptom of undefined behaviour depends on compiler, optimisation level and timing; the violation does not.",
    },
    {
      question: "Which sanitizers can be combined?",
      answer:
        "ASan and UBSan can and normally should be — `-fsanitize=address,undefined` is the standard development configuration. TSan and UBSan can also be combined. ASan and TSan cannot: both need to control the memory layout and the compiler rejects the combination. MSan cannot be combined with ASan either, and additionally requires all dependencies to be instrumented. The practical consequence is that CI needs two jobs — one ASan+UBSan and one TSan — because running only one means choosing which class of bug to not find.",
    },
    {
      question: "What is the most commonly missed sanitizer setting?",
      answer:
        "`-fno-sanitize-recover=all` for UBSan. By default UBSan prints `runtime error:` and *continues execution*, so a test suite can emit dozens of undefined-behaviour reports and still exit zero — CI passes, and nobody reads the log. That flag turns each into an immediate abort with a non-zero exit. Two others worth setting: `UBSAN_OPTIONS=print_stacktrace=1`, since UBSan gives only a source line by default, and `ASAN_OPTIONS=detect_stack_use_after_return=1`, which is off by default and covers a whole bug class. Also always build with `-g` and `-fno-omit-frame-pointer` or the traces are unusable.",
    },
    {
      question: "Should sanitizers ever be enabled in production?",
      answer:
        "No, with one narrow exception. Beyond the performance cost, ASan's shadow memory and deterministic allocator layout are a security liability — Google's own guidance states explicitly that ASan is not a hardening mechanism and should not be treated as one. For production hardening the tools are `_FORTIFY_SOURCE=3`, stack protectors and Control Flow Integrity. The exception is `-fsanitize=undefined` combined with `-fsanitize-minimal-runtime` and `-fsanitize-trap`, which converts undefined behaviour into an immediate trap with almost no overhead and no diagnostic machinery — a legitimate fail-fast mechanism for production builds.",
    },
    {
      question: "What are the limits of what a sanitizer can tell you?",
      answer:
        "Coverage. A sanitizer only instruments code that actually executes, so a bug on a branch your tests never take is never reported — a clean run is not proof of absence, only evidence about the paths exercised. That is why sanitizers pair with, rather than replace, static analysis, which reasons about paths without running them. TSan has a second limit worth knowing: it detects missing *synchronisation*, not insufficient *ordering*, so code using `relaxed` where it needed `acquire`/`release` is not a data race and TSan stays silent. Sanitizers have essentially no false positives, so every report is real.",
    },
  ],
  takeaways: [
    "Sanitizers detect the violation itself, not its eventual symptom",
    "ASan: memory errors and leaks, ~2× slower, ~3× memory",
    "UBSan: signed overflow, bad shifts, null deref, bad casts — negligible cost",
    "TSan: data races and lock-order inversions, 5–15× slower",
    "MSan: uninitialised reads, Clang only, needs every library instrumented",
    "ASan and TSan cannot be combined; ASan+UBSan and TSan+UBSan can",
    "So CI needs two jobs, or you are choosing which bugs to miss",
    "UBSan reports and continues by default — `-fno-sanitize-recover=all` or CI passes with errors",
    "`UBSAN_OPTIONS=print_stacktrace=1` and ASan's `detect_stack_use_after_return=1` are off by default",
    "Always build with `-g -fno-omit-frame-pointer`, and prefer `-O1` to `-O0`",
    "A suppression is a bug you decided not to fix — review them",
    "Never ship ASan to production; it is not a hardening mechanism",
    "Coverage is the limit: a clean run is evidence, not proof",
  ],
  status: "available",
};
