import type { TrackDefinition } from "@/content/types";
import { createComingSoonModule } from "@/content/comingSoon";
import { rustFoundationsModule } from "./modules/01-foundations";

/**
 * Rust, taught as a language you have never written, for building things with
 * rather than for answering questions about.
 *
 * Two consequences for the shape of the syllabus. First, module 1 starts at
 * "what is this and why does it exist" and gets you to a declared variable and
 * a running binary before anything conceptual arrives. Second, the track ends
 * on shipping real projects instead of an interview module: the room that would
 * have gone to interview questions goes to tooling, testing and real programs.
 *
 * Ownership lands in module 3, early enough that the borrow checker stops being
 * an obstacle, but after functions and control flow so there is something to
 * own.
 */
const soon = (input: Parameters<typeof createComingSoonModule>[0]) =>
  createComingSoonModule({ ...input, interviewPrep: false });

export const rustTrack: TrackDefinition = {
  id: "rust",
  slug: "rust",
  title: "Rust",
  shortTitle: "Rust",
  tagline: "Memory safety without a garbage collector, enforced at compile time",
  description:
    "Rust from absolute zero — what it is, what it is for, and how to declare your first variable — through to writing systems software in it. You meet ownership early enough that the borrow checker stops being an obstacle, then work outward through traits, error handling, concurrency, async and unsafe. This is a track for building things: every module ends with programs you compile and run, and it finishes on shipping real projects rather than on interview questions.",
  order: 7,
  status: "coming-soon",
  accent: "rust",
  mode: "learn",
  lessonMinutes: [25, 40],
  interviewPrep: false,
  runnable: false,
  modules: [
    rustFoundationsModule,
    soon({
      id: "rust-control-flow",
      slug: "control-flow-functions",
      title: "Control Flow, Functions & Program Structure",
      order: 2,
      description:
        "Turning a page of statements into a program: functions with real signatures, the expression-oriented control flow that surprises people coming from C, and a first command-line tool you can actually use.",
      topics: [
        "Functions, parameters, return types, and the implicit final expression",
        "Statements against expressions, and why let x = if … compiles",
        "if and else, and the absence of truthiness",
        "loop, while and for, and iterating over a range",
        "break with a value, continue, and labelled loops",
        "Nested functions, early returns, and keeping a function readable",
        "rustfmt, clippy, and what idiomatic layout actually looks like",
        "Building a complete command-line program from an empty directory",
      ],
    }),
    soon({
      id: "rust-ownership",
      slug: "ownership-borrowing-lifetimes",
      title: "Ownership, Borrowing & Lifetimes",
      order: 3,
      description:
        "The module the whole language is built on: who owns a value, who may look at it, and how the compiler proves no reference outlives what it points to — all without a garbage collector.",
      topics: [
        "The stack, the heap, and why Rust needs you to know the difference",
        "Ownership and moves, and why assignment can invalidate a variable",
        "Copy and Clone, and which types are which",
        "Borrowing: shared references, mutable references, and the one-writer rule",
        "Slices, and borrowing part of a collection",
        "Lifetimes, elision rules, and reading a signature with 'a in it",
        "Drop, and what happens at the closing brace",
        "Patterns that make the borrow checker agree with you",
      ],
    }),
    soon({
      id: "rust-types",
      slug: "structs-enums-matching",
      title: "Structs, Enums & Pattern Matching",
      order: 4,
      description:
        "Rust's data modelling: product types, sum types, and the exhaustive matching that makes illegal states genuinely unrepresentable.",
      topics: [
        "Structs, tuple structs, unit structs, and the update syntax",
        "impl blocks, methods, associated functions, and the self receivers",
        "Enums as real sum types, with data in each variant",
        "Option, and a language with no null",
        "Result, and errors that the type system will not let you ignore",
        "match, exhaustiveness, guards, ranges, and binding with @",
        "if let, let else, and while let",
        "Modelling a real domain: turning a spec into types that cannot lie",
      ],
    }),
    soon({
      id: "rust-collections",
      slug: "collections-strings-iterators",
      title: "Collections, Strings & Iterators",
      order: 5,
      description:
        "The standard collections, the two string types that confuse everyone exactly once, and the iterator protocol that replaces most loops you would otherwise write.",
      topics: [
        "Vec: creation, growth, indexing, and borrowing its contents",
        "HashMap, BTreeMap, and the entry API",
        "VecDeque, HashSet, BTreeSet, and choosing between them",
        "String against &str, and why both have to exist",
        "UTF-8, chars, bytes, and why you cannot index a string",
        "The Iterator trait: next, laziness, and writing your own",
        "Adaptors and consumers: map, filter, fold, collect and the turbofish",
        "Iterating without allocating, and where the zero-cost claim holds",
      ],
    }),
    soon({
      id: "rust-errors",
      slug: "error-handling",
      title: "Error Handling",
      order: 6,
      description:
        "Errors as values: propagating with ?, designing error types other people can match on, and knowing the small set of cases where panicking is the correct answer.",
      topics: [
        "Result revisited, and the ? operator's desugaring",
        "panic!, unwrap and expect, and when each is defensible",
        "Designing an error enum, and implementing Display and Error",
        "From conversions, and how ? uses them to change error type",
        "thiserror for libraries, anyhow for applications",
        "Option combinators, and converting between Option and Result",
        "Errors at the edges: exit codes, main returning Result, and logging",
      ],
    }),
    soon({
      id: "rust-traits",
      slug: "traits-generics",
      title: "Traits & Generics",
      order: 7,
      description:
        "How Rust does polymorphism: traits as shared behaviour, generics monomorphised at compile time, and trait objects for when the type is only known at runtime.",
      topics: [
        "Traits, implementations, default methods, and the orphan rule",
        "Generic functions and types, and what monomorphisation costs",
        "Trait bounds, where clauses, and impl Trait in both positions",
        "Static against dynamic dispatch, and dyn Trait objects",
        "Associated types against generic parameters",
        "Operator overloading, and the std traits worth implementing",
        "Derive macros, and the ones you should write by hand instead",
        "Designing a trait: the abstraction boundary in a real library",
      ],
    }),
    soon({
      id: "rust-smart-pointers",
      slug: "smart-pointers-interior-mutability",
      title: "Smart Pointers & Interior Mutability",
      order: 8,
      description:
        "What to reach for when a single owner and a compile-time borrow are not enough: heap allocation, shared ownership, and mutation checked at runtime instead.",
      topics: [
        "Box, heap allocation, and recursive types",
        "Deref, deref coercion, and Drop order",
        "Rc: shared ownership by reference counting",
        "Cell and RefCell, and moving the borrow check to runtime",
        "Reference cycles, leaks, and breaking them with Weak",
        "Arc and Mutex as the thread-safe counterparts",
        "A decision table you can actually use, with worked examples",
      ],
    }),
    soon({
      id: "rust-modules",
      slug: "modules-crates-cargo",
      title: "Modules, Crates & Cargo",
      order: 9,
      description:
        "How a Rust project is organised, built and published — the point where a file of code becomes something other people can depend on.",
      topics: [
        "The module tree: mod, use, pub, and absolute against relative paths",
        "Splitting one file into many, and re-exporting a clean public API",
        "Crates, binaries against libraries, and multi-crate workspaces",
        "Cargo.toml: dependencies, features, and semantic versioning",
        "Cargo.lock, reproducible builds, and vendoring",
        "Build profiles, and what release mode actually changes",
        "Publishing to crates.io, and what you owe your users afterwards",
      ],
    }),
    soon({
      id: "rust-testing",
      slug: "testing-docs-debugging",
      title: "Testing, Documentation & Debugging",
      order: 10,
      description:
        "The feedback loop around your code: tests that run with one command, documentation the compiler checks, and what to do when a program still misbehaves.",
      topics: [
        "Unit tests, #[cfg(test)], and the conventions cargo test expects",
        "Integration tests, and testing your crate as a consumer would",
        "Documentation comments, and doc tests that fail the build when stale",
        "Benchmarking with criterion, and measuring rather than guessing",
        "Debugging with rust-gdb, dbg! and structured logging",
        "Property testing and fuzzing, and what they catch that examples miss",
        "Continuous integration for a Rust project, end to end",
      ],
    }),
    soon({
      id: "rust-concurrency",
      slug: "concurrency-parallelism",
      title: "Concurrency & Parallelism",
      order: 11,
      description:
        "Why data races are a compile error in Rust, and how Send and Sync turn thread safety into something the type system checks rather than something you hope for.",
      topics: [
        "Threads, join handles, and move closures",
        "Send and Sync, and what makes a type safe to share",
        "Channels and message passing",
        "Mutex, RwLock, and shared state without data races",
        "Atomics and the memory orderings",
        "Scoped threads, and borrowing across a thread boundary",
        "Data parallelism with rayon, and when it actually pays",
        "Building a concurrent program: a parallel file processor",
      ],
    }),
    soon({
      id: "rust-async",
      slug: "async-rust",
      title: "Async Rust & Networked Services",
      order: 12,
      description:
        "Futures as state machines, the executor that drives them, and the ecosystem decisions you have to make before writing a line of async code — ending with a service that serves real traffic.",
      topics: [
        "Futures, poll, and why nothing happens until you await",
        "async and await, and the state machine the compiler builds",
        "Runtimes: tokio, async-std, and choosing one deliberately",
        "Spawning, joining, select, and cancellation",
        "Pin and Unpin, and the problem they exist to solve",
        "Async traits, streams, and back pressure",
        "Building an HTTP service with axum, from route to response",
        "Async pitfalls: blocking the executor, and how to notice",
      ],
    }),
    soon({
      id: "rust-unsafe",
      slug: "unsafe-ffi-systems",
      title: "Unsafe, FFI & Systems Rust",
      order: 13,
      description:
        "The escape hatch and its contract: what unsafe actually permits, what you promise in exchange, and how Rust talks to the C world it has to live in.",
      topics: [
        "What unsafe does and, more importantly, does not switch off",
        "Raw pointers, and the invariants you now maintain by hand",
        "Undefined behaviour in Rust, and catching it with miri",
        "Writing a safe abstraction over an unsafe core",
        'extern "C", the C ABI, and calling into a C library',
        "Exposing Rust to C, cbindgen and bindgen",
        "no_std, embedded targets, and code that never allocates",
        "Cross compilation, and shipping a binary for another machine",
      ],
    }),
    soon({
      id: "rust-projects",
      slug: "idiomatic-rust-projects",
      title: "Idiomatic Rust & Shipping Real Projects",
      order: 14,
      description:
        "The consolidation pass: turning working Rust into Rust other people enjoy depending on, and taking a project all the way from an empty directory to a released binary.",
      topics: [
        "API design: newtype, builder, typestate, and sealed traits",
        "Making illegal states unrepresentable, in practice",
        "Declarative macros, and when a macro is the wrong answer",
        "Performance work: profiling, allocation, and where Rust is not fast",
        "Reading unfamiliar Rust, and reviewing it well",
        "Project: a command-line tool, from cargo new to a released binary",
        "Project: a library crate with docs, tests, CI and a published version",
      ],
    }),
  ],
};
