import type { Lesson } from "@/content/types";

export const variablesLesson: Lesson = {
  id: "rust-variables",
  slug: "variables-mutability-constants",
  moduleSlug: "foundations",
  title: "Declaring Variables: let, mut, Shadowing & Constants",
  summary:
    "How to declare a variable in Rust, why it is immutable unless you say otherwise, what shadowing is and when it is the right tool, and the two different kinds of constant the language gives you.",
  estimatedMinutes: 35,
  objectives: [
    "Declare variables with and without explicit type annotations",
    "Explain why bindings are immutable by default, and what that buys you",
    "Use `mut` correctly, and know when you genuinely need it",
    "Use shadowing to change a value's type without inventing a second name",
    "Choose between `const` and `static`, and know why neither is `let`",
    "Recognise the compiler errors these mistakes produce",
  ],
  sections: [
    {
      id: "let",
      heading: "let: the only way to declare a variable",
      body: [
        "Rust has one keyword for introducing a variable, and it is `let`. There is no `var`, no `int x`, no separate declaration and assignment.",
        "The formal shape is `let name: Type = value;` — but the type annotation is usually optional, because the compiler infers it from the value. This is worth being precise about: **Rust is statically typed, not manifestly typed.** Every variable has a fixed type known at compile time; you just do not have to write it down when it is obvious.",
        "The technical term for what `let` creates is a **binding**, not a variable, and the distinction becomes meaningful later: a binding associates a name with a value, and it is the binding — not the value — that is or is not mutable.",
      ],
      examples: [
        {
          id: "let-basics",
          title: "Declaring, with and without annotations",
          lang: "rust",
          code: `fn main() {
    // Inferred. \`answer\` is an i32, because that is the default integer type.
    let answer = 42;

    // Annotated. Sometimes required, often useful documentation.
    let ratio: f64 = 0.75;

    // Annotation is required here: \`parse\` can produce many numeric types,
    // so the compiler needs to be told which one you meant.
    let parsed: u32 = "512".parse().unwrap();

    // Declare now, assign once, later. The compiler checks that every path
    // assigns it exactly once before it is read.
    let message;
    if answer > 40 {
        message = "large";
    } else {
        message = "small";
    }

    println!("{answer} {ratio} {parsed} {message}");
}`,
          output: `42 0.75 512 large`,
          explanation:
            "The last form is worth remembering. Deferred initialisation is allowed, and the compiler verifies that the binding is definitely assigned before any use — so you get the flexibility without the uninitialised-variable bug it causes in C.",
        },
      ],
    },
    {
      id: "immutable",
      heading: "Immutable by default",
      body: [
        "This is the first genuinely unusual thing about the language, and it catches everyone once. **A `let` binding cannot be reassigned.** Not because it is a constant, but because Rust made the safer option the default one.",
        "Coming from almost any other language this feels backwards. It is worth understanding what it buys, because it is not arbitrary.",
        "**It makes the exceptional case visible.** When every variable can change, you have to read a whole function to know whether any particular one does. When mutation is opt-in, `mut` is a marker you can scan for — and a reviewer can see the four things a hundred-line function actually modifies without reading it line by line.",
        "**It is the foundation of the borrow rules.** Module 3 introduces the rule that a value may have many readers or one writer, never both at once. That rule only works because the compiler can tell readers from writers, and `mut` is how it tells.",
        "**It gets you better machine code.** A value the compiler knows never changes can be kept in a register, computed once, or folded away entirely.",
      ],
      examples: [
        {
          id: "immutable-error",
          title: "The error you will see on your first day",
          lang: "rust",
          code: `fn main() {
    let x = 5;
    println!("x is {x}");
    x = 6;
    println!("x is {x}");
}`,
          output: `error[E0384]: cannot assign twice to immutable variable \`x\`
 --> main.rs:4:5
  |
2 |     let x = 5;
  |         - first assignment to \`x\`
3 |     println!("x is {x}");
4 |     x = 6;
  |     ^^^^^ cannot assign twice to immutable variable
  |
help: consider making this binding mutable
  |
2 |     let mut x = 5;
  |         +++`,
          explanation:
            "Read the whole message, including the `help` block at the bottom — it is showing you the exact edit to make, with the `+++` marking the characters to insert. Rust's diagnostics do this constantly, and getting into the habit of reading to the end of them will save you more time than any other single thing in this track.",
        },
        {
          id: "mut-fixed",
          title: "The same program with mut",
          lang: "rust",
          code: `fn main() {
    let mut x = 5;
    println!("x starts at {x}");
    x = 6;
    println!("x is now {x}");
}`,
          output: `x starts at 5
x is now 6`,
          explanation:
            "`mut` goes on the binding, not the type: it is `let mut x: i32`, never `let x: mut i32`. A reassignment must also keep the same type — `mut` permits a new *value*, not a new *type*.",
        },
      ],
      pitfalls: [
        {
          title: "Do not add `mut` reflexively to silence the compiler",
          body: "When E0384 appears, the right first question is \"should this actually change?\" Very often the answer is no, and the real fix is to compute the final value in one expression, or to use shadowing. Reaching straight for `mut` works, but it gives away the guarantee for free. The compiler will also warn you about a `mut` you never used, which is a useful nudge in the other direction.",
        },
      ],
    },
    {
      id: "shadowing",
      heading: "Shadowing: reusing a name for a new binding",
      body: [
        "You can declare `let` with a name that already exists. This is not reassignment — it creates a **new binding** that hides the old one for the rest of the scope. The original value still exists until its scope ends; you simply cannot reach it by that name any more.",
        "The distinction matters because shadowing does something `mut` cannot: **it can change the type.**",
        "The idiomatic use is a value that arrives in one form and is immediately converted into another. Without shadowing you would invent `input_str` and `input_num`, and then spend the rest of the function being careful about which is which.",
      ],
      examples: [
        {
          id: "shadowing-basics",
          title: "Shadowing changes the type; scope brings the old one back",
          lang: "rust",
          code: `fn main() {
    let spaces = "   ";        // &str
    let spaces = spaces.len(); // usize — a different type, same name
    println!("{spaces} spaces");

    let count = 5;
    {
        // Inside this block, \`count\` means something else.
        let count = count * 2;
        println!("inner count: {count}");
    }
    // The inner binding is gone; the outer one was never touched.
    println!("outer count: {count}");
}`,
          output: `3 spaces
inner count: 10
outer count: 5`,
          explanation:
            "The second `let spaces` reads the first one to compute its own value, then hides it. Note that `count` stayed immutable throughout — shadowing does not require or imply `mut`, because nothing was mutated.",
        },
        {
          id: "shadowing-vs-mut",
          title: "Why mut cannot do this",
          lang: "rust",
          code: `fn main() {
    let mut value = "   ";
    value = value.len();
}`,
          output: `error[E0308]: mismatched types
 --> main.rs:3:13
  |
2 |     let mut value = "   ";
  |                     ----- expected due to this value
3 |     value = value.len();
  |             ^^^^^^^^^^^ expected \`&str\`, found \`usize\``,
          explanation:
            "`mut` says the value may change. The *type* is fixed at declaration and is not negotiable. If you need a different type, you need a different binding — which is exactly what shadowing gives you.",
        },
      ],
      pitfalls: [
        {
          title: "Shadowing across a large scope hurts readability",
          body: "Shadowing is at its best when the two bindings are adjacent and the second is obviously derived from the first. Shadowing a name forty lines later, in a different part of a long function, is how you write code where a reader has to scroll to find out what a name currently means. Keep it tight.",
        },
      ],
    },
    {
      id: "constants",
      heading: "const and static: values that are not bindings",
      body: [
        "Rust has two more ways to name a value, and they are not interchangeable with `let`.",
        "**`const` is a compile-time constant.** The type annotation is mandatory, the value must be computable at compile time, and `mut` is not allowed. Conceptually it is not a variable at all — it is *inlined* at every place you use it, the way a `#define` would be, but type-checked. You can declare one at module level or inside a function, and the naming convention is SCREAMING_SNAKE_CASE.",
        "**`static` is a value with a fixed memory address** that lives for the entire run of the program. It has one location rather than being copied to each use site, and its lifetime is `'static`. Use it for genuinely global data — a large lookup table, a string you want exactly one copy of.",
        "The practical rule: **reach for `const` by default.** `static` matters when you need a stable address or the value is large enough that duplicating it wastes space. A `static mut` is possible but requires `unsafe` (mutable global state is a data race waiting to happen), and you should treat needing one as a sign to reconsider the design.",
      ],
      examples: [
        {
          id: "const-static",
          title: "Both kinds, at module scope",
          lang: "rust",
          code: `// Type annotation is required. Inlined wherever it is used.
const MAX_USERS: u32 = 100_000;

// One address, lives for the whole program.
static GREETING: &str = "hello";

fn main() {
    println!("{MAX_USERS} {GREETING}");

    let mut total = 0u32;
    total += MAX_USERS;
    println!("{total}");
}`,
          output: `100000 hello
100000`,
          explanation:
            "The underscores in `100_000` are a readability feature and are ignored by the compiler — you can put them anywhere in a numeric literal. The `0u32` suffix on the other side is the opposite: it is a type annotation attached to the literal itself, which is often tidier than writing `let mut total: u32 = 0`.",
        },
        {
          id: "const-error",
          title: "const values must be computable without running anything",
          lang: "rust",
          code: `use std::time::SystemTime;

const STARTED_AT: SystemTime = SystemTime::now();

fn main() {
    println!("{STARTED_AT:?}");
}`,
          output: `error[E0015]: cannot call non-const associated function \`SystemTime::now\` in constants
 --> main.rs:3:32
  |
3 | const STARTED_AT: SystemTime = SystemTime::now();
  |                                ^^^^^^^^^^^^^^^^^
  |
  = note: calls in constants are limited to constant functions, tuple structs and tuple variants`,
          explanation:
            "There is no moment at which a `const` is initialised, so anything that has to actually happen — reading a clock, allocating, opening a file — is off limits. Functions marked `const fn` are the exception, and there are more of them in the standard library with every release.",
        },
      ],
    },
    {
      id: "conventions",
      heading: "Naming, and what the compiler will nag you about",
      body: [
        "Rust has strong conventions and the compiler enforces them with warnings rather than errors. Following them costs nothing and makes your code look like everyone else's.",
        "Variables and functions are `snake_case`. Types, traits and enum variants are `UpperCamelCase`. Constants and statics are `SCREAMING_SNAKE_CASE`. Modules and crate names are `snake_case`.",
        "A variable you declare and never read produces an `unused_variables` warning. If that is deliberate — a value you need to receive but do not care about — prefix the name with an underscore, and the warning goes away. A bare `_` discards the value entirely.",
        "Take the warnings seriously. Rust's are unusually low-noise: an unused variable in a language this explicit is nearly always a typo, a forgotten branch, or code you meant to delete.",
      ],
      examples: [
        {
          id: "unused-warning",
          title: "The unused variable warning, and how to silence it honestly",
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
            "This is a warning, not an error — the program compiles and runs. The `note` at the bottom names the lint (`unused_variables`), which is how you would allow or deny it explicitly with an attribute if you ever needed to.",
        },
      ],
    },
  ],
  takeaways: [
    "`let` is the only way to declare a variable; the type annotation is optional because inference fills it in, not because typing is dynamic",
    "Bindings are immutable by default — `mut` opts in, and its visibility is what makes the borrow rules in module 3 possible",
    "`mut` allows a new value of the same type; shadowing creates a new binding and can change the type",
    "Shadowing is idiomatic for immediate conversions, and a readability problem when stretched across a long scope",
    "`const` is inlined and must be computable at compile time; `static` has one fixed address for the life of the program",
    "snake_case for values, UpperCamelCase for types, SCREAMING_SNAKE_CASE for constants — and prefix deliberately unused names with `_`",
  ],
  status: "available",
};
