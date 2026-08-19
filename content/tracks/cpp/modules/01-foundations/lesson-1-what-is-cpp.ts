import type { Lesson } from "@/content/types";

export const whatIsCppLesson: Lesson = {
  id: "cpp-what-is-cpp",
  slug: "what-cpp-is",
  moduleSlug: "foundations",
  title: "What C++ Is, What It Is For & Where It Runs",
  summary:
    "Before any syntax: what kind of language C++ is, the one design principle that explains almost every decision in it, what it is genuinely the best tool for, and what it costs you in exchange.",
  estimatedMinutes: 25,
  objectives: [
    "Explain what a compiled, statically typed, unmanaged language means in practice",
    "State the zero-overhead principle and what follows from it",
    "Name the domains where C++ is still the default choice, and why",
    "Describe honestly what C++ costs compared to a managed language",
    "Know which C++ you are learning, and why the version matters so much",
  ],
  sections: [
    {
      id: "what-it-is",
      heading: "Three words that define the language",
      body: [
        "C++ is a **compiled**, **statically typed**, **unmanaged** language. Those three words predict most of what you are about to meet, so they are worth unpacking properly rather than skimming.",
        "**Compiled** means a separate program — the compiler — reads your source and produces machine code for a specific processor and operating system *before* the program ever runs. There is no interpreter present at runtime, and no just-in-time compiler warming up. The `.exe` or binary you ship contains instructions your CPU executes directly. The practical consequence: your program starts instantly and runs at full speed from the first line, and a build for one machine will not run on a different kind of machine.",
        "**Statically typed** means every expression has a type the compiler knows and checks. `int`, `double`, `std::string`, and every type you define. If you pass a string where a number belongs, the program does not fail at 3am in production — it fails to build on your machine, in a second, with a message naming the line.",
        "**Unmanaged** is the one that really separates C++ from Java, C#, Python and JavaScript. There is **no garbage collector**. Nothing in the background scans memory to see what is still in use. When you allocate memory, something must eventually release it, and *the language expects you to have a plan for that*. This sounds like a burden, and in 1995 it was. Modern C++ has an answer — RAII, which you meet in module 4 — that makes it largely automatic while keeping the cost at zero. But the responsibility never moves; it just gets expressed in the type system rather than in your memory.",
      ],
      examples: [
        {
          id: "compiled-vs-interpreted",
          title: "The workflow you are signing up for",
          lang: "bash",
          code: `# Python or JavaScript: one step. The interpreter reads the source
# and starts executing it.
$ python3 hello.py
Hello, world!

# C++: two steps, and they are separated in time.
$ g++ -std=c++20 hello.cpp -o hello    # compile — may take a second, or a minute
$ ./hello                              # run — no compiler involved any more
Hello, world!

# The build product is a real, standalone program.
$ file hello
hello: ELF 64-bit LSB pie executable, x86-64, dynamically linked`,
          explanation:
            "The separation is the whole trade. You pay a compile step every time you change the code, and in exchange the running program carries no interpreter, no bytecode, and no runtime type machinery. It also means that a whole class of mistakes gets caught in the first step rather than the second — which is why C++ programmers develop the habit of compiling constantly.",
        },
      ],
    },
    {
      id: "zero-overhead",
      heading: "The zero-overhead principle",
      body: [
        "Bjarne Stroustrup, who created the language, states its guiding rule in two parts:",
        "**What you don't use, you don't pay for.** A feature you never touch costs your program nothing — not a byte of memory, not a cycle of runtime. This is why C++ has no mandatory garbage collector, no universal base class that every object inherits from, and no runtime reflection. Every one of those would tax programs that never use them.",
        "**What you do use, you couldn't hand-code any better.** An abstraction the language gives you should compile to the same machine code as the equivalent hand-written low-level version. `std::vector`'s indexing compiles to the same instruction as raw pointer arithmetic. A `std::sort` call beats a hand-written `qsort` because the comparison can be inlined.",
        "This principle explains decisions that otherwise look hostile. Why are variables not zero-initialised by default? Because zeroing costs cycles, and a variable you are about to overwrite should not pay them. Why is bounds checking not on by default for arrays? Because a loop that has already proven its index is in range should not check again.",
        "It is worth being clear-eyed about the flip side. The same principle is why an out-of-range index reads whatever memory happens to be there instead of raising an exception. C++ hands you the performance and hands you the responsibility in the same motion. **The rest of this track is largely about how to take the first without being destroyed by the second.**",
      ],
      pitfalls: [
        {
          title: "\"Zero-overhead\" is a design goal, not a promise about your code",
          body: "The principle says the *abstraction* costs nothing beyond what the equivalent hand-written code would. It does not say your program is fast. A `std::map` lookup is as fast as a hand-written red-black tree lookup — and still much slower than the flat array you should have used. Choosing the wrong data structure costs you far more than any language feature, in C++ exactly as in every other language.",
        },
      ],
    },
    {
      id: "where-used",
      heading: "Where C++ is actually used, and why it wins there",
      body: [
        "C++ is not a general-purpose default in the way Python or TypeScript are. It is the right answer in specific situations, and knowing which ones tells you a lot about the language.",
        "**Game engines and real-time graphics.** Unreal Engine, Unity's core, and essentially every AAA title's renderer. A frame budget at 60fps is 16.6 milliseconds. A garbage collection pause of 20ms is a visible stutter, and you cannot ask the player to wait. C++ gives you a frame with no pauses you did not schedule.",
        "**Systems and infrastructure software.** Chrome, Firefox, and their JavaScript engines (V8 and SpiderMonkey are C++). MySQL, PostgreSQL's competitors, MongoDB, ClickHouse. LLVM and GCC themselves. When your software is the layer everything else runs on, its overhead is everyone's overhead.",
        "**Financial and low-latency systems.** High-frequency trading, exchange matching engines, market data feeds. These are measured in microseconds and sometimes nanoseconds, and are one of the few places people routinely read the compiler's assembly output.",
        "**Embedded and safety-critical work.** Cars, medical devices, avionics, robotics, spacecraft. Often no operating system at all, sometimes no heap allocation permitted, and hard real-time deadlines. C++ can be used with parts of itself switched off in a way most languages cannot.",
        "**Scientific and numerical computing.** Simulation, computational biology, CAD, machine learning at the bottom of the stack. TensorFlow and PyTorch are Python interfaces over C++ engines — which is one of the most common shapes in real software: *Python for the API, C++ for the loop that runs a billion times.*",
        "The common thread is not \"speed\" in the abstract. It is **predictability**: knowing when memory is allocated, when it is freed, when a function is called, and that nothing will run behind your back at an inconvenient moment.",
      ],
    },
    {
      id: "the-cost",
      heading: "What it costs — stated honestly",
      body: [
        "You will meet enthusiasts who say the difficulty is exaggerated and detractors who say the language is unusable. Neither is useful. Here is the fair version.",
        "**It is a big language.** The C++20 standard is over 1,800 pages. There are usually several ways to do anything, and some of them are historical mistakes that cannot be removed because working code depends on them. You will spend real time learning which subset to actually use.",
        "**Mistakes are unforgiving.** In Python, an off-by-one raises `IndexError`. In C++ it may read a neighbouring variable, or corrupt memory that crashes the program ten minutes later somewhere unrelated. This is *undefined behaviour*, and it is the single most important concept separating C++ from managed languages. Module 3 confronts it directly, and by the end of this track you will run your code under sanitizers as a matter of habit.",
        "**The build system is a separate skill.** Other languages ship one blessed tool — `cargo`, `npm`, `pip`. C++ has CMake, Make, Bazel, Meson, vcpkg, Conan, and a compilation model inherited from 1972. Module 12 covers this properly because it is genuinely part of the job.",
        "**Error messages can be brutal.** A single mistake inside a template can produce hundreds of lines. This has improved enormously — C++20's concepts exist substantially to fix it — but you will meet the old kind.",
        "The reasonable conclusion: **do not reach for C++ because it is fast.** Reach for it when you need control over memory and timing, when you are working in a domain that has already chosen it, or when you want to understand what every other language is built on top of. Those are all excellent reasons. \"Because it is the fastest\" is how people end up spending three weeks on something Python would have finished in an afternoon.",
      ],
      pitfalls: [
        {
          title: "C++ is not \"C with classes\" any more, and writing it that way hurts",
          body: "The two languages diverged decades ago. Idiomatic modern C++ uses `std::vector` rather than `malloc`, `std::string` rather than `char*`, RAII rather than manual `free`, and references rather than pointers wherever it can. Code that looks like C compiled with a C++ compiler is the single most common source of memory bugs in real codebases. If you know C already, treat that as a head start on syntax and a liability on style.",
        },
      ],
    },
    {
      id: "which-cpp",
      heading: "Which C++ you are learning",
      body: [
        "C++ is standardised on a three-year cycle, and the version matters far more than it does in most languages — because the recommended way to do something genuinely changes between them.",
        "**C++98/03** — the language most old codebases and most old tutorials are written in. Manual memory management, no `auto`, no lambdas, no move semantics. If a tutorial uses `new` and `delete` casually, this is what you are reading, and you should close it.",
        "**C++11** — the release that split the language in two. Smart pointers, move semantics, `auto`, lambdas, range-based `for`, threads in the standard library. Almost everything people mean by \"modern C++\" starts here.",
        "**C++14 and C++17** — refinement. `std::optional`, `std::variant`, structured bindings, `if` with an initialiser, filesystem support.",
        "**C++20** — the second-largest release ever. Concepts, ranges, modules, coroutines, `std::format`, the spaceship operator. **This track's baseline.** It is what a new project should target today, and it is well supported by current compilers.",
        "**C++23** — `std::expected`, `std::print`, and a long list of smaller improvements. Used in this track where it changes the recommended answer, and always labelled, because plenty of real projects are pinned to an older compiler.",
        "You select the version at compile time, and this is not optional trivia — the same source file can compile differently, or not at all, depending on the flag.",
      ],
      examples: [
        {
          id: "std-flag",
          title: "The flag that decides which language you are writing",
          lang: "bash",
          code: `# Ask the compiler which standard it defaults to. Do not rely on this.
$ g++ -std=c++20 main.cpp -o main    # what this track assumes
$ g++ -std=c++23 main.cpp -o main    # for std::print and std::expected
$ g++ -std=c++17 main.cpp -o main    # very common in existing codebases

# Turn on the warnings. Treat this as part of "compiling", not as optional.
$ g++ -std=c++20 -Wall -Wextra main.cpp -o main`,
          explanation:
            "**Get into the habit of `-Wall -Wextra` now, on the very first program you write.** C++ compilers stay quiet by default about a long list of things that are almost certainly bugs — a comparison between signed and unsigned, a variable you never read, a function that falls off the end without returning. Those warnings are the cheapest bug-finding available to you, and turning them on costs nothing.",
        },
      ],
      pitfalls: [
        {
          title: "Most C++ material on the internet is out of date",
          body: "This is a bigger problem for C++ than for almost any other language, because so much of it was written before 2011 and still ranks well in search results. Signals that you are reading something obsolete: raw `new`/`delete` outside a resource-owning class, `NULL` instead of `nullptr`, `char*` used for text, manual loops where an algorithm exists, or `using namespace std;` at the top of a header. None of those are illegal — they are simply not how the language is written now.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does it mean that C++ has no garbage collector, and how do modern C++ programs manage memory?",
      answer:
        "Nothing runs in the background to reclaim unused memory, so every allocation needs an owner responsible for releasing it. Modern C++ solves this with RAII: a resource is acquired in a constructor and released in the destructor, and because destructors run deterministically when an object leaves scope, cleanup happens automatically without a collector. `std::vector`, `std::string` and `std::unique_ptr` are all applications of this idea. The result is automatic memory management with no pauses and no runtime cost, at the price of having to express ownership in the types.",
    },
    {
      question: "What is the zero-overhead principle?",
      answer:
        "Two claims. First, what you do not use, you do not pay for — an unused feature costs nothing in memory or cycles, which is why there is no mandatory garbage collector, no universal base class and no runtime reflection. Second, what you do use, you could not hand-code any better — an abstraction should compile to the same machine code as the equivalent low-level version. It explains many of the language's rougher edges, including why variables are not zero-initialised and why array access is not bounds-checked.",
    },
    {
      question: "When would you choose C++ over a managed language, and when would you not?",
      answer:
        "Choose it when you need predictable memory and timing — real-time graphics, low-latency trading, embedded and safety-critical systems, or the engine underneath a higher-level API, which is the shape of TensorFlow and PyTorch. Do not choose it merely because it is fast: the development cost is real, undefined behaviour makes mistakes expensive, and the build tooling is a separate skill. For most application and web work, a managed language will get there sooner and the runtime difference will not matter.",
    },
    {
      question: "Why does the C++ standard version matter so much when it barely comes up in other languages?",
      answer:
        "Because the recommended way to do things genuinely changed. C++11 introduced smart pointers, move semantics, `auto` and lambdas, which is why pre-2011 and post-2011 C++ look like different languages. C++17 added `optional` and `variant`, C++20 added concepts, ranges and `std::format`. Knowing which standard a codebase targets tells you which idioms are available, and it is why so much C++ material online is actively misleading — it predates the version you are writing.",
    },
  ],
  takeaways: [
    "C++ is compiled, statically typed and unmanaged — no interpreter at runtime, types checked at build time, and no garbage collector",
    "The zero-overhead principle: you pay nothing for features you do not use, and abstractions you do use compile as well as hand-written code",
    "It wins where predictability matters — games, browsers, databases, trading, embedded — not simply where speed sounds appealing",
    "The real costs are the size of the language, undefined behaviour, the build tooling, and template error messages",
    "This track targets C++20, with C++23 features labelled where they change the answer",
    "Turn on `-Wall -Wextra` from your very first program; it is the cheapest bug-finding you will ever get",
    "Treat pre-2011 C++ material as actively misleading, not merely dated",
  ],
  status: "available",
};
