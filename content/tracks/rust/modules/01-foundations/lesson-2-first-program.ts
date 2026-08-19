import type { Lesson } from "@/content/types";

export const firstProgramLesson: Lesson = {
  id: "rust-first-program",
  slug: "toolchain-and-first-program",
  moduleSlug: "foundations",
  title: "The Toolchain & Your First Program",
  summary:
    "Install Rust, understand what rustup, rustc and cargo each do, then write, compile and run a program two different ways — first by hand, then the way every real project does it.",
  estimatedMinutes: 30,
  objectives: [
    "Install Rust and verify the installation",
    "Explain the difference between rustup, rustc and cargo",
    "Compile and run a single file with rustc directly",
    "Create, build and run a project with cargo",
    "Read Cargo.toml, and know what the target directory contains",
    "Know when to use cargo check, cargo build and cargo build --release",
  ],
  sections: [
    {
      id: "install",
      heading: "Installing Rust",
      body: [
        "Rust is installed through **rustup**, which is a *toolchain manager* rather than a compiler. It downloads and updates compilers, keeps several versions side by side, and adds targets so you can build for other platforms. Do not install Rust from your Linux distribution's package manager — those builds are often months behind, and rustup is what the ecosystem assumes you have.",
        "One command installs everything, on Linux and macOS:",
      ],
      examples: [
        {
          id: "rust-install",
          title: "Install, then check it worked",
          lang: "bash",
          code: `# Install rustup, which installs the rest
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart your shell, or source the environment it just wrote
source "$HOME/.cargo/env"

# Three things should now answer
rustc --version
cargo --version
rustup --version`,
          output: `rustc 1.95.0 (59807616e 2026-04-14)
cargo 1.95.0 (f2d3ce0bd 2026-03-21)
rustup 1.29.0 (28d1352db 2026-03-05)`,
          explanation:
            "Your version numbers will be higher than these — Rust ships a new stable release every six weeks. Everything in this track works on any recent stable version. On Windows, download `rustup-init.exe` from rustup.rs instead; you will also need the Microsoft C++ build tools, which the installer prompts you for.",
        },
      ],
    },
    {
      id: "three-tools",
      heading: "rustup, rustc and cargo: three tools, three jobs",
      body: [
        "New Rust programmers routinely confuse these, and it makes error messages harder to read than they need to be. They do genuinely different things.",
        "**rustup** manages *versions*. `rustup update` pulls the latest stable compiler. `rustup toolchain install nightly` gets you the nightly build alongside it. `rustup target add wasm32-unknown-unknown` teaches your installation to build for WebAssembly. You will use it rarely, and mostly on days when you are changing what is installed rather than writing code.",
        "**rustc** is the compiler itself. It takes `.rs` files and produces a binary. You can call it directly, and in this lesson you will, but in practice almost nobody does — the same way almost nobody calls `gcc` by hand on a C project.",
        "**cargo** is the build system and package manager, and it is the tool you actually live in. It calls `rustc` for you with the right flags, resolves and downloads dependencies, runs your tests, builds your documentation, and publishes your crate. Every Rust project you meet will be a cargo project.",
      ],
      pitfalls: [
        {
          title: "`cargo` is not optional in real work",
          body: "It is tempting to keep using `rustc file.rs` because it feels simpler. It stops working the moment you want a dependency, a second source file, or a test — none of which `rustc` will organise for you. Use `rustc` directly for the two examples in this lesson, then never again.",
        },
      ],
    },
    {
      id: "by-hand",
      heading: "The hard way first: rustc on a single file",
      body: [
        "Doing this once makes what cargo does afterwards feel like convenience rather than magic. Create a file called `main.rs` with the following in it.",
      ],
      examples: [
        {
          id: "hello-rustc",
          title: "main.rs",
          lang: "rust",
          code: `fn main() {
    println!("Hello, world!");
}`,
          explanation:
            "`fn` declares a function. `main` is special: it is where execution starts, and every executable Rust program has exactly one. The braces delimit the body, and `println!` writes a line to standard output.",
        },
        {
          id: "hello-rustc-build",
          title: "Compile it, then run it",
          lang: "bash",
          code: `rustc main.rs
./main`,
          output: `Hello, world!`,
          explanation:
            "`rustc` produced a standalone executable next to your source file — `main` on Linux and macOS, `main.exe` on Windows. It is a complete native binary: you can copy it to another machine with the same architecture and it will run there with no Rust installed.",
        },
      ],
    },
    {
      id: "the-bang",
      heading: "Why println! has an exclamation mark",
      body: [
        "This trips people up on line one, so it is worth clearing immediately. **The `!` means `println!` is a macro, not a function.** A macro runs at compile time and generates code; a function runs at runtime and takes values.",
        "`println!` has to be a macro because it does something a Rust function cannot: it takes a variable number of arguments, and it checks your format string against them *while compiling*. If you write a placeholder with no matching value, that is a compile error rather than a crash or a garbage output line — unlike C's `printf`, which will happily read whatever is next on the stack.",
        "You will meet a handful of other macros early — `vec!` for building vectors, `panic!` for aborting, `format!` for producing a `String` instead of printing — and you can write your own much later. For now: the `!` tells you the compiler is doing something clever, and you can otherwise read it as a normal call.",
      ],
      examples: [
        {
          id: "println-forms",
          title: "The forms of println! you will use daily",
          lang: "rust",
          code: `fn main() {
    let name = "Ada";
    let year = 1843;

    // Capture a variable directly by name inside the braces.
    println!("{name} wrote the first program in {year}.");

    // Positional: values are supplied after the format string.
    println!("{} + {} = {}", 2, 3, 2 + 3);

    // {:?} is the "debug" format, for anything not meant for end users.
    let pair = (1, "one");
    println!("{pair:?}");

    // {:#?} is the same thing, pretty-printed across lines.
    println!("{pair:#?}");

    // print! is the same without the trailing newline.
    print!("no newline here");
    println!(" <- same line");
}`,
          output: `Ada wrote the first program in 1843.
2 + 3 = 5
(1, "one")
(
    1,
    "one",
)
no newline here <- same line`,
          explanation:
            "`{}` requires a type that knows how to display itself to a human. `{:?}` requires only that the type is *debuggable*, which most standard types are and which you can ask the compiler to derive for your own. When you are exploring, `{:?}` is almost always the one you want.",
        },
      ],
      pitfalls: [
        {
          title: "Inline captures only work for plain variable names",
          body: "`println!(\"{name}\")` works, but `println!(\"{user.name}\")` does not — the braces take an identifier, not an expression. Write `println!(\"{}\", user.name)` instead. The compiler's error here is clear, but the reason is not obvious the first time.",
        },
      ],
    },
    {
      id: "cargo",
      heading: "The real way: a cargo project",
      body: [
        "`cargo new` creates a project with the layout every Rust tool expects. From then on, one command builds and runs it regardless of how many files and dependencies it grows.",
      ],
      examples: [
        {
          id: "cargo-new",
          title: "Create a project and look at what you got",
          lang: "bash",
          code: `cargo new hello_cargo
cd hello_cargo`,
          output: `    Creating binary (application) \`hello_cargo\` package
note: see more \`Cargo.toml\` keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

hello_cargo
├── Cargo.toml
├── .gitignore
└── src
    └── main.rs`,
          explanation:
            "Four things: a manifest, a git ignore file, a source directory, and a `main.rs` containing the same hello-world you just wrote by hand. `cargo new` also initialises a git repository, which is why there is a `.gitignore` — pass `--vcs none` if you do not want that.",
        },
        {
          id: "cargo-toml",
          title: "Cargo.toml — the manifest",
          lang: "bash",
          code: `[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2024"

[dependencies]`,
          explanation:
            "`name` and `version` are what your crate is called if you publish it. `edition` is the one worth understanding: Rust uses *editions* (2015, 2018, 2021, 2024) to make small backwards-incompatible syntax changes without splitting the language. Crates on different editions interoperate perfectly, so a 2024 crate can depend on a 2015 one. `[dependencies]` is where other people's crates go, and it is empty because you have none yet.",
        },
        {
          id: "cargo-run",
          title: "Build and run in one command",
          lang: "bash",
          code: `cargo run`,
          output: `   Compiling hello_cargo v0.1.0 (/home/you/hello_cargo)
    Finished \`dev\` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running \`target/debug/hello_cargo\`
Hello, world!`,
          explanation:
            "Run it a second time without changing anything and the `Compiling` line disappears — cargo tracks what has changed and only rebuilds what it must. The binary lives at `target/debug/hello_cargo`, and you can run it directly; `cargo run` is just building it first and then doing that for you.",
        },
      ],
    },
    {
      id: "cargo-commands",
      heading: "The four cargo commands you will use every day",
      body: [
        "**`cargo check`** — type-checks and borrow-checks your code but does *not* generate a binary. It is dramatically faster than a full build, often by several times, because code generation is most of the work. This is what you run in a loop while you are writing; it catches everything except bugs in the behaviour of code that compiles.",
        "**`cargo build`** — a full debug build. Overflow checks are on, debug symbols are included, and optimisation is off, which makes the binary slow but the errors informative. This is the default for a reason: while developing you want to be told when something overflows, not to have it quietly wrap around.",
        "**`cargo run`** — build if needed, then run. Arguments for your program go after a `--`, as in `cargo run -- --verbose input.txt`, so cargo can tell its own flags from yours.",
        "**`cargo build --release`** — the optimised build, written to `target/release/` instead. Expect it to take several times longer to compile and to run anywhere from twice to fifty times faster. **Never benchmark a debug build**; the numbers are meaningless.",
        "Two more worth knowing on day one: `cargo test` runs your tests, and `cargo clippy` runs a linter that is far more opinionated than the compiler and is worth taking seriously — it teaches idiomatic Rust faster than any book.",
      ],
      examples: [
        {
          id: "cargo-release",
          title: "Debug and release are different builds, in different places",
          lang: "bash",
          code: `cargo build
ls target/debug/hello_cargo

cargo build --release
ls target/release/hello_cargo`,
          output: `    Finished \`dev\` profile [unoptimized + debuginfo] target(s) in 0.02s
target/debug/hello_cargo
   Compiling hello_cargo v0.1.0 (/home/you/hello_cargo)
    Finished \`release\` profile [optimized] target(s) in 0.12s
target/release/hello_cargo`,
          explanation:
            "Note `[unoptimized + debuginfo]` against `[optimized]` in the two Finished lines — cargo tells you which profile it used every time. The `target/` directory is build output only; it is in the generated `.gitignore` and you can delete it at any time with `cargo clean`.",
        },
      ],
      pitfalls: [
        {
          title: "A slow Rust program is usually a debug build",
          body: "This is the single most common false alarm from people new to the language: they write something, run `cargo run`, find it slower than the Python version, and conclude Rust is not fast. Debug builds disable optimisation entirely and add bounds and overflow checking. Always measure with `--release`.",
        },
      ],
    },
  ],
  takeaways: [
    "rustup manages toolchain versions, rustc is the compiler, cargo is the build system you actually use",
    "`rustc main.rs` produces a standalone native binary with no runtime dependency",
    "`println!` is a macro, not a function — the `!` means the format string is checked at compile time",
    "`{}` displays a value for humans, `{:?}` debug-prints it, and `{:#?}` pretty-prints it over several lines",
    "`cargo new` scaffolds the layout every Rust tool expects; Cargo.toml is the manifest and `edition` is not the same as version",
    "`cargo check` for the fast feedback loop, `cargo run` while developing, `cargo build --release` before you measure anything",
  ],
  status: "available",
};
