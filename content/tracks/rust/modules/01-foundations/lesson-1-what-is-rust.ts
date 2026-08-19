import type { Lesson } from "@/content/types";

export const whatIsRustLesson: Lesson = {
  id: "rust-what-is-rust",
  slug: "what-is-rust",
  moduleSlug: "foundations",
  title: "What Rust Is, and Why It Exists",
  summary:
    "Before a single line of code: what kind of language Rust is, the specific problem it was built to solve, where it is actually used in production today, and what the compiler does that no other mainstream language's compiler does.",
  estimatedMinutes: 25,
  objectives: [
    "Say what Rust is in one sentence, accurately",
    "Explain the memory-management trade-off every language makes, and which corner Rust occupies",
    "Name where Rust is used in production and why it was chosen there",
    "Understand what 'zero-cost abstraction' and 'no runtime' actually mean",
    "Decide honestly whether Rust is the right tool for a given job",
  ],
  sections: [
    {
      id: "one-sentence",
      heading: "Rust in one sentence",
      body: [
        "**Rust is a compiled, statically typed systems programming language that guarantees memory safety at compile time, without a garbage collector.**",
        "Every word in that sentence is load-bearing, so take them one at a time.",
        "**Compiled** — you run a compiler over your source and get a native executable. There is no interpreter and no virtual machine between your code and the CPU. A Rust binary starts as fast as a C binary because, by the time it runs, it *is* machine code.",
        "**Statically typed** — every value's type is known when the program is compiled. Unlike JavaScript or Python, a variable that holds a number cannot later hold a string. Unlike Java or C#, you rarely have to write the types out, because the compiler infers most of them.",
        "**Systems programming language** — Rust is designed for software that sits close to the machine: operating systems, browsers, databases, embedded devices, network services where the last microsecond matters. It gives you direct control over memory layout and does not allocate behind your back.",
        "**Memory safety at compile time, without a garbage collector** — this is the part that is genuinely new, and the reason the language exists at all. It gets the rest of this lesson.",
      ],
    },
    {
      id: "the-problem",
      heading: "The problem Rust was built to solve",
      body: [
        "Every programming language has to answer one question: *when a piece of memory is no longer needed, who frees it, and when?* Historically there have been exactly two answers, and each one costs you something.",
        "**Answer one: you do it, by hand.** This is C and C++. You call `malloc` and you call `free`; you `new` and you `delete`. The upside is total control and no overhead — nothing runs that you did not ask for. The downside is that humans are bad at this. Free a pointer twice and you corrupt the allocator. Free it and keep using it and you have a *use-after-free*, reading memory that now belongs to something else. Forget to free it and you leak. Read one element past the end of an array and you are looking at whatever happened to be next in memory.",
        "These are not exotic mistakes made by bad programmers. Microsoft reported that around **70% of the security vulnerabilities it assigns a CVE are memory safety issues**, and the Chromium project has published a near-identical figure. These are the most reviewed, best-tested C and C++ codebases in the world.",
        "**Answer two: a garbage collector does it.** This is Java, Go, C#, Python, JavaScript. A runtime component periodically works out which memory is still reachable and frees the rest. The upside is that use-after-free stops being possible — you cannot use memory the collector has not freed, because it will not free memory you can still reach. The downside is that a program is now running collection work you did not write, at moments you do not choose, and that costs both throughput and predictability. For a web server that is usually fine. For an audio driver, a game engine's frame loop, or a kernel, a pause at the wrong moment is the bug.",
        "**Rust's answer is a third one: the compiler works it out, and inserts the frees for you.** Every value has exactly one owner; when the owner goes out of scope, the value is freed, and the compiler knows where that point is because it can see the scope. There is no collector because there is nothing to collect at runtime — the decisions were all made during compilation.",
        "The price is that the compiler has to *prove* it is safe to do this, and it will reject any program where it cannot. That rejection is the famous Rust learning curve. It is also the whole value proposition: the class of bug that produces 70% of security vulnerabilities is, in safe Rust, a compile error.",
      ],
      pitfalls: [
        {
          title: "Memory safety is not the same as bug-free",
          body: "Rust will not stop you writing an infinite loop, an off-by-one in your business logic, or a deadlock. It rules out a specific and important family of bugs — use-after-free, double free, data races, buffer overruns, null dereferences — and leaves the rest of software engineering exactly as hard as it was.",
        },
      ],
    },
    {
      id: "no-runtime",
      heading: "No runtime, and what that buys you",
      body: [
        "Go ships a runtime: a scheduler for goroutines and a garbage collector, compiled into every binary. Java ships a whole virtual machine. Python ships an interpreter. Rust ships essentially nothing — a tiny amount of setup code before `main`, and that is it.",
        "This has three practical consequences worth understanding up front.",
        "**You can put Rust anywhere.** Because there is no runtime to bring along, Rust can be compiled for a microcontroller with 16 KB of RAM, or built as a shared library that a Python program loads, or linked into an existing C codebase one function at a time. This is why Rust shows up inside projects that are otherwise written in something else.",
        "**Abstractions are free.** The Rust community's phrase for this is *zero-cost abstraction*: using an iterator chain with `map` and `filter` compiles to the same machine code as the hand-written loop you were avoiding. A generic function is compiled separately for each concrete type it is used with (*monomorphisation*), so there is no dynamic lookup at runtime. You do not pay for expressiveness.",
        "**Performance is predictable.** No collector means no pause you did not schedule. The time a piece of code takes is a function of the work it does, not of how much garbage some other part of the program happened to produce.",
        "Underneath, `rustc` hands your code to **LLVM** — the same optimising backend that powers Clang — so Rust benefits from decades of C and C++ compiler engineering. In practice, well-written Rust performs within noise of well-written C.",
      ],
    },
    {
      id: "where-used",
      heading: "Where Rust is actually used",
      body: [
        "This matters more than benchmarks, because it tells you what kind of problem Rust is genuinely good at.",
        "**Operating systems.** The Linux kernel has accepted Rust for driver development since version 6.1 — the first language other than C admitted in the kernel's history. Windows has shipped Rust in kernel components. Android's Bluetooth and ultra-wideband stacks were rewritten in it.",
        "**Browsers.** Rust came out of Mozilla, and Firefox's CSS engine (Stylo) and WebRender graphics pipeline are written in it. These were the original proving grounds: highly parallel code where data races in C++ had been a persistent source of crashes.",
        "**Infrastructure and networking.** Cloudflare's proxy (Pingora), AWS's Firecracker microVM behind Lambda, and the Deno runtime are all Rust. The common thread is software that must be fast, must not crash, and must not have exploitable memory bugs, because it is directly exposed to hostile input.",
        "**Command-line tooling.** `ripgrep`, `fd`, `bat`, `uv` and much of the modern JavaScript toolchain are Rust. Here the draw is different: fast startup with no runtime to boot, easy single-binary distribution, and a package manager that makes building someone else's project a one-line operation.",
        "**Embedded and WebAssembly.** No runtime means Rust fits where a garbage collector cannot, and compiles to small WebAssembly modules for the browser.",
      ],
    },
    {
      id: "a-taste",
      heading: "A first look at the language",
      body: [
        "You are not expected to understand this yet — it is here so that the shape of the language is familiar before we start building it up. Read it as English and move on.",
      ],
      examples: [
        {
          id: "rust-taste",
          title: "A small program that shows several of Rust's ideas at once",
          lang: "rust",
          code: `fn main() {
    // A vector: a growable list, allocated on the heap.
    let scores = vec![88, 42, 97, 65, 73];

    // An iterator chain. This compiles down to a single loop
    // with no intermediate collections allocated.
    let passing: Vec<i32> = scores
        .iter()
        .copied()
        .filter(|score| *score >= 60)
        .collect();

    // \`Option\` instead of null: \`max\` might have nothing to return,
    // and the type system makes you say what happens if it does not.
    match passing.iter().max() {
        Some(best) => println!("{} passed, best was {best}", passing.len()),
        None => println!("nobody passed"),
    }
} // \`scores\` and \`passing\` are freed here. No free() call, no collector.`,
          output: `4 passed, best was 97`,
          explanation:
            "Three things to notice. There is no `free` and no garbage collector, yet both heap allocations are released at the closing brace. There is no `null` — `max` returns an `Option`, and `match` forces you to handle the empty case. And the iterator chain is not slower than a hand-written loop; it compiles to the same thing.",
        },
      ],
    },
    {
      id: "when-not",
      heading: "When Rust is the wrong choice",
      body: [
        "A track that only tells you what a language is good at is marketing, not teaching. Rust costs you things.",
        "**Compile times are slow.** Monomorphisation and the sheer amount of analysis the compiler performs mean a large Rust project takes noticeably longer to build than the equivalent Go project. `cargo check` (type-check without generating code) softens this during development, but it is a real cost.",
        "**The learning curve is front-loaded and steep.** Ownership and borrowing are genuinely new concepts, and there is a period — usually a few weeks of real use — where you will fight the compiler. This track is arranged to shorten that period, not to pretend it does not exist.",
        "**It is verbose for problems that do not need the control.** A shell script, a one-off data cleanup, a prototype you will throw away next week: Python will be finished before Rust has finished compiling. Choosing Rust for a script is choosing to pay for guarantees the script does not need.",
        "The honest rule: reach for Rust when *correctness under load* or *performance without unpredictability* is the actual requirement. If neither is, reach for whatever gets you to the answer fastest.",
      ],
      pitfalls: [
        {
          title: "\"Rust is hard\" usually means one specific thing",
          body: "Almost everyone who says Rust is hard is talking about the borrow checker rejecting a program they believe is correct. That is a real experience and it is temporary. The syntax, the standard library and the tooling are, if anything, easier than the C++ equivalents. Module 3 of this track exists to get you through the borrow checker properly rather than by trial and error.",
        },
      ],
    },
  ],
  takeaways: [
    "Rust is compiled, statically typed, and produces native binaries with no interpreter or VM in between",
    "Memory management has historically meant manual (fast, unsafe) or garbage collected (safe, unpredictable); Rust's ownership system is a third option that is both",
    "Around 70% of CVEs in large C/C++ codebases are memory safety bugs — the exact class that safe Rust rules out at compile time",
    "No runtime means Rust fits in kernels, embedded devices, and inside programs written in other languages",
    "Zero-cost abstraction: iterators and generics compile to the same code you would have written by hand",
    "The costs are real — slow compiles and a steep initial curve — and Rust is the wrong tool for throwaway scripts",
  ],
  status: "available",
};
