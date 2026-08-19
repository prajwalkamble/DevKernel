import type { Lesson } from "@/content/types";

export const readingErrorsLesson: Lesson = {
  id: "rust-reading-errors",
  slug: "reading-compiler-errors",
  moduleSlug: "foundations",
  title: "Reading What the Compiler Tells You",
  summary:
    "Rust's error messages are a teaching tool, not an obstacle — but only if you read all of them. The anatomy of a diagnostic, what the error codes are for, the difference between an error, a warning and a lint, and how to make clippy teach you idiomatic Rust.",
  estimatedMinutes: 30,
  objectives: [
    "Read every part of a rustc diagnostic, including the help and note blocks",
    "Use `rustc --explain` and `cargo --explain` to get the long-form explanation",
    "Tell errors, warnings and lints apart, and know which are configurable",
    "Fix the four errors that account for most of a beginner's first week",
    "Use clippy as a way of learning idiom rather than as a chore",
  ],
  sections: [
    {
      id: "why",
      heading: "Why this gets a whole lesson",
      body: [
        "Most languages' compilers tell you that something is wrong and roughly where. Rust's tells you what is wrong, points at the two places involved, explains the rule you broke, and very often shows you the exact characters to insert. The team treats diagnostics as a product feature, and it is the main reason the language is learnable at all given how much it checks.",
        "The practical failure mode for beginners is not that the messages are bad — it is that people read the first line, feel told off, and start guessing. **The information you need is almost always below the first line.** Getting into the habit of reading to the bottom is worth more than memorising any syntax in this module.",
      ],
    },
    {
      id: "anatomy",
      heading: "The anatomy of a diagnostic",
      body: [
        "Every rustc error has the same structure. Once you can name the parts, they stop being a wall of text.",
      ],
      examples: [
        {
          id: "anatomy-example",
          title: "One error, six parts",
          lang: "rust",
          code: `fn main() {
    let count: i32 = "seven";
    println!("{count}");
}`,
          output: `error[E0308]: mismatched types
 --> main.rs:2:22
  |
2 |     let count: i32 = "seven";
  |                ---   ^^^^^^^ expected \`i32\`, found \`&str\`
  |                |
  |                expected due to this

error: aborting due to 1 previous error

For more information about this error, try \`rustc --explain E0308\`.`,
          explanation:
            "**`error[E0308]`** — the severity and the stable error code. **`mismatched types`** — the one-line summary. **`--> main.rs:2:22`** — file, line, column. **The source excerpt** — with `^^^` under the thing that is wrong and `---` under the thing it conflicts with. **`expected due to this`** — the second annotation, telling you *why* an `i32` was expected. **The final line** — the command that prints a page of explanation.",
        },
      ],
    },
    {
      id: "explain",
      heading: "rustc --explain: the manual page you already have",
      body: [
        "Every `E`-numbered error has a long-form explanation built into the compiler, with a minimal broken example and a fixed version. It works offline and it is often better than searching.",
        "Use `rustc --explain E0308` directly, or `cargo --explain E0308` inside a project. The codes are stable across releases, so an explanation you read once stays valid.",
      ],
      examples: [
        {
          id: "explain-cmd",
          title: "Asking for the long version",
          lang: "bash",
          code: `rustc --explain E0384`,
          output: `An immutable variable was reassigned.

Erroneous code example:

\`\`\`
fn main() {
    let x = 3;
    x = 5; // error, reassignment of immutable variable
}
\`\`\`

By default, variables in Rust are immutable. To fix this error, add the keyword
\`mut\` after the keyword \`let\` when declaring the variable. For example:

\`\`\`
fn main() {
    let mut x = 3;
    x = 5;
}
\`\`\``,
          explanation:
            "Output is trimmed here. The explanations are short, concrete and written around a minimal example — which is usually exactly what you need to see the shape of the problem separately from your own code.",
        },
      ],
    },
    {
      id: "errors-warnings-lints",
      heading: "Errors, warnings and lints are three different things",
      body: [
        "**An error stops compilation.** Nothing is produced. These come from the type checker, the borrow checker, or the parser, and they are not configurable — you cannot switch off the borrow checker.",
        "**A warning compiles, but tells you something is probably wrong.** Unused variables, unused imports, unreachable code, a `mut` that was never needed. Warnings are *lints*, and lints can be configured.",
        "**A lint is a named rule** that can be set to `allow`, `warn`, `deny` or `forbid`. That is what the `note` at the bottom of a warning is telling you: `#[warn(unused_variables)]` means the `unused_variables` lint is currently set to warn. You can change it with an attribute in your source or a flag on the command line.",
        "Some lints are set to `deny` by default, which is why an array index the compiler can prove is out of range produces an *error* from `unconditional_panic` even though it is technically a lint.",
      ],
      examples: [
        {
          id: "warning-anatomy",
          title: "A warning names the lint that produced it",
          lang: "rust",
          code: `fn main() {
    let total = 10;
    let unused = 5;
    println!("{total}");
}`,
          output: `warning: unused variable: \`unused\`
 --> main.rs:3:9
  |
3 |     let unused = 5;
  |         ^^^^^^ help: if this is intentional, prefix it with an underscore: \`_unused\`
  |
  = note: \`#[warn(unused_variables)]\` (part of \`#[warn(unused)]\`) on by default

warning: 1 warning emitted`,
          explanation:
            "The program still built and ran. The `help` gives the idiomatic fix — rename to `_unused` if you meant it — and the `note` names the lint, so you know what to write if you ever need `#![allow(unused_variables)]` at the top of a file. Do that sparingly: warnings in Rust have a high signal-to-noise ratio.",
        },
      ],
      pitfalls: [
        {
          title: "Do not let warnings accumulate",
          body: "A project with two hundred warnings is a project where nobody notices the two that matter. Fix them as they appear. Many teams go further and add `#![deny(warnings)]` in CI only — denying them locally is irritating while you are mid-refactor, but letting them merge is worse.",
        },
      ],
    },
    {
      id: "common-four",
      heading: "The errors you will actually hit this week",
      body: [
        "Four errors account for most of a beginner's compile failures. Each has a distinctive shape, and once you recognise it the fix is usually mechanical.",
      ],
      examples: [
        {
          id: "e0384",
          title: "E0384 — assigning to something you did not declare mut",
          lang: "rust",
          code: `fn main() {
    let x = 5;
    x = 6;
}`,
          output: `error[E0384]: cannot assign twice to immutable variable \`x\`
help: consider making this binding mutable
  |
2 |     let mut x = 5;
  |         +++`,
          explanation:
            "Output trimmed to the useful part. Before adding `mut`, ask whether the value should change at all — shadowing or a single expression is often the better fix.",
        },
        {
          id: "e0308-return",
          title: "E0308 — a stray semicolon swallowing your return value",
          lang: "rust",
          code: `fn double(n: i32) -> i32 {
    n * 2;
}

fn main() {
    println!("{}", double(21));
}`,
          output: `error[E0308]: mismatched types
 --> main.rs:1:22
  |
1 | fn double(n: i32) -> i32 {
  |    ------            ^^^ expected \`i32\`, found \`()\`
  |    |
  |    implicitly returns \`()\` as its body has no tail or \`return\` expression
2 |     n * 2;
  |          - help: remove this semicolon to return this value`,
          explanation:
            "This is the most common Rust-specific mistake there is, and the diagnostic is a small masterpiece: it points at the return type, explains that the body falls off the end returning unit, and puts a marker under the exact semicolon to delete. **An expression with a semicolon is a statement and evaluates to `()`; without one it is the block's value.**",
        },
        {
          id: "e0277",
          title: "E0277 — mixing numeric types",
          lang: "rust",
          code: `fn main() {
    let x = 3;
    let y = 2.5;
    println!("{}", x + y);
}`,
          output: `error[E0277]: cannot add a float to an integer
 --> main.rs:4:22
  |
4 |     println!("{}", x + y);
  |                      ^ no implementation for \`{integer} + {float}\`
  |
  = help: the trait \`Add<{float}>\` is not implemented for \`{integer}\``,
          explanation:
            "E0277 means \"this type does not implement the trait this operation needs\", and it covers far more than arithmetic — you will see it whenever a trait bound is unsatisfied. Here the fix is an explicit cast: `x as f64 + y`. Note `{integer}` in braces: that is the compiler saying the type is not yet pinned down.",
        },
        {
          id: "e0433",
          title: "E0433 — a name that does not exist, usually a typo or a missing import",
          lang: "rust",
          code: `fn main() {
    let path = Path::new("/tmp");
    println!("{path:?}");
}`,
          output: `error[E0433]: cannot find type \`Path\` in this scope
 --> main.rs:2:16
  |
2 |     let path = Path::new("/tmp");
  |                ^^^^ use of undeclared type \`Path\`
  |
help: consider importing this struct
  |
1 + use std::path::Path;
  |`,
          explanation:
            "The `help` block writes the import for you, with `1 +` meaning \"insert this as line 1\". Rust does almost no implicit importing — only the prelude, a small set of universally useful items — so needing a `use` line is normal rather than a sign you did something wrong.",
        },
      ],
    },
    {
      id: "clippy",
      heading: "clippy: the linter that teaches idiom",
      body: [
        "`cargo clippy` runs several hundred extra lints on top of the compiler's. It is not a style checker — that is `cargo fmt`, which reformats and has no opinions to argue with. Clippy is about *idiom*: it recognises patterns that work but that an experienced Rust programmer would write differently, and tells you what they would write instead.",
        "For someone learning the language this is unusually valuable. Clippy will catch you writing a manual loop where an iterator exists, comparing `x.len() > 0` instead of `!x.is_empty()`, cloning where a borrow would do, or matching on an `Option` where `if let` reads better. Each of those is a small lesson delivered exactly when it is relevant.",
        "Install it with `rustup component add clippy` if it is not already there, and run it as often as you run the compiler.",
      ],
      examples: [
        {
          id: "clippy-example",
          title: "Clippy explaining a better way to write something that already works",
          lang: "bash",
          code: `cargo clippy`,
          output: `warning: length comparison to zero
 --> src/main.rs:3:8
  |
3 |     if names.len() > 0 {
  |        ^^^^^^^^^^^^^^^ help: using \`!is_empty\` is clearer and more explicit: \`!names.is_empty()\`
  |
  = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#len_zero
  = note: \`#[warn(clippy::len_zero)]\` on by default

warning: \`clip\` (bin "clip") generated 1 warning (run \`cargo clippy --fix --bin "clip" -p clip -- \` to apply 1 suggestion)`,
          explanation:
            "The code compiled and was correct. Clippy is telling you what the same intent looks like written idiomatically, naming the lint (`clippy::len_zero`) and linking to its documentation. Take these seriously early and you will skip a lot of the awkward-Rust phase.",
        },
      ],
      pitfalls: [
        {
          title: "Not every clippy lint deserves obedience",
          body: "Clippy has pedantic and nursery lint groups that are off by default, and even the default set occasionally suggests something that reads worse in context. When you disagree, `#[allow(clippy::some_lint)]` with a comment saying why is a perfectly good answer. Blind compliance is not the goal; understanding why it fired is.",
        },
      ],
    },
    {
      id: "habits",
      heading: "Two habits worth forming now",
      body: [
        "**Read the whole message before touching the code.** Rust's diagnostics are longer than most because they contain more; skipping to the fix is how you end up making a change that produces a second, more confusing error.",
        "**Fix the first error first, then recompile.** One mistake often produces several errors as the consequences propagate, and later ones are frequently noise. Fixing the top error and rebuilding is faster than reading the whole list — and `cargo check` makes that loop take a fraction of a second.",
      ],
    },
  ],
  takeaways: [
    "The useful part of a Rust diagnostic is usually below the first line — read the help and note blocks",
    "`rustc --explain E0308` (or `cargo --explain`) gives a long-form explanation with a minimal example, offline",
    "Errors stop the build and are not configurable; warnings come from lints, which can be set to allow, warn, deny or forbid",
    "E0384 (missing mut), E0308 (type mismatch, often a stray semicolon), E0277 (unsatisfied trait bound) and E0433 (missing import) cover most early failures",
    "A semicolon turns an expression into a statement whose value is `()` — the cause of the most common Rust-specific error there is",
    "`cargo clippy` teaches idiom, `cargo fmt` handles formatting, and `cargo check` gives you the fastest possible feedback loop",
  ],
  status: "available",
};
