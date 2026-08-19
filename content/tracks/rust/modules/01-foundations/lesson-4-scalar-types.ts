import type { Lesson } from "@/content/types";

export const scalarTypesLesson: Lesson = {
  id: "rust-scalar-types",
  slug: "scalar-types",
  moduleSlug: "foundations",
  title: "Scalar Types: Integers, Floats, Booleans & Characters",
  summary:
    "The four families of single-value type, how big each one is, what Rust does when an integer overflows (and why the answer differs between debug and release), and the explicit casting rules that replace the silent conversions you are used to.",
  estimatedMinutes: 35,
  objectives: [
    "Choose an integer type deliberately, including when usize is the right one",
    "Explain what happens on overflow in debug and in release, and why they differ",
    "Use the checked, wrapping and saturating arithmetic methods",
    "Understand f32 against f64, and why floats do not compare equal",
    "Know that a Rust char is four bytes and holds a Unicode scalar value",
    "Cast between numeric types with `as`, and know what it silently discards",
  ],
  sections: [
    {
      id: "integers",
      heading: "Integers: twelve types, one default",
      body: [
        "Rust makes you say how big your integers are, and whether they can be negative. The signed types are `i8`, `i16`, `i32`, `i64`, `i128` and `isize`; the unsigned ones are `u8`, `u16`, `u32`, `u64`, `u128` and `usize`. The number is the width in bits.",
        "**`i32` is the default.** When you write `let x = 5;` with nothing to constrain it, that is what you get. It is a good default: big enough for almost anything you count, and fast on every architecture Rust targets.",
        "**`usize` and `isize` are pointer-sized** — 64 bits on a 64-bit machine, 32 on a 32-bit one. `usize` is the type of a length and of an index, so it shows up constantly whether or not you asked for it. You cannot index a collection with an `i32`; you have to convert.",
        "How to choose, in practice: use `i32` unless you have a reason not to. Use `u8` when you mean a byte. Use `usize` for lengths, indices and capacities. Reach for `i64`/`u64` when the values genuinely can be large — timestamps in nanoseconds, byte counts of big files, ids from a database.",
      ],
      examples: [
        {
          id: "integer-types",
          title: "Declaring integers, and asking about their limits",
          lang: "rust",
          code: `fn main() {
    let a: i32 = -42;          // 32-bit signed, the default integer type
    let b: u8 = 255;           // 8-bit unsigned: 0..=255
    let c: i64 = 9_223_372_036_854_775_807;
    let d = 1_000_000;         // inferred as i32
    let e: usize = 10;         // pointer-sized: what indexing uses

    println!("{a} {b} {c} {d} {e}");
    println!("i32 range: {} .. {}", i32::MIN, i32::MAX);
    println!("u8 range:  {} .. {}", u8::MIN, u8::MAX);
    println!("size of i32 = {} bytes", std::mem::size_of::<i32>());
    println!("size of usize = {} bytes", std::mem::size_of::<usize>());
}`,
          output: `-42 255 9223372036854775807 1000000 10
i32 range: -2147483648 .. 2147483647
u8 range:  0 .. 255
size of i32 = 4 bytes
size of usize = 8 bytes`,
          explanation:
            "Every numeric type carries its own `MIN` and `MAX` associated constants, so you never have to remember the boundaries. Literals can be written in decimal, hex (`0xff`), octal (`0o77`), binary (`0b1111_0000`) or as a byte (`b'A'`), and underscores are ignored everywhere.",
        },
      ],
    },
    {
      id: "overflow",
      heading: "Overflow: the behaviour that changes between builds",
      body: [
        "This is the single most important thing in this lesson, and it surprises people who come from C.",
        "In C, a `signed` integer overflowing is *undefined behaviour* — the compiler is allowed to assume it never happens and to optimise on that basis, which is a genuine source of security bugs. In Java, it wraps around silently. Rust does neither by default.",
        "**In a debug build, integer overflow panics.** The program stops, tells you exactly where, and does not continue with a wrong number.",
        "**In a release build, it wraps around** using two's complement, exactly like Java. Checking on every arithmetic operation costs real performance, and the release profile turns it off.",
        "This is a deliberate trade, and knowing about it is the point: you develop and test with the checks on, so overflow bugs surface loudly during development rather than silently in production. It also means that **overflow behaviour is not something you should ever rely on**, in either direction.",
      ],
      examples: [
        {
          id: "overflow-debug",
          title: "The same program, two builds, two behaviours",
          lang: "rust",
          code: `fn main() {
    let mut small: u8 = 250;
    for _ in 0..10 {
        small += 1;
        println!("{small}");
    }
}`,
          output: `# cargo run  (debug)
251
252
253
254
255
thread 'main' (7326) panicked at src/main.rs:4:9:
attempt to add with overflow
note: run with \`RUST_BACKTRACE=1\` environment variable to display a backtrace

# cargo run --release
251
252
253
254
255
0
1
2
3
4`,
          explanation:
            "The number in parentheses after `thread 'main'` is the thread id and will differ on your machine. In debug the program dies at the moment 255 + 1 is attempted; in release it wraps to 0 and carries on as if nothing happened. Neither is a bug in Rust — the bug is a `u8` holding a value that can exceed 255.",
        },
        {
          id: "overflow-methods",
          title: "Saying what you actually want",
          lang: "rust",
          code: `fn main() {
    let big: u8 = 250;

    // Returns Option: None when it would overflow.
    println!("checked: {:?}", big.checked_add(10));
    println!("checked: {:?}", big.checked_add(5));

    // Clamps to the maximum instead of wrapping.
    println!("saturating: {}", big.saturating_add(10));

    // Wraps deliberately, in every build.
    println!("wrapping: {}", big.wrapping_add(10));

    // Wraps, and tells you whether it did.
    println!("overflowing: {:?}", big.overflowing_add(10));
}`,
          output: `checked: None
checked: Some(255)
saturating: 255
wrapping: 4
overflowing: (4, true)`,
          explanation:
            "Every integer type has this family of methods. If overflow is a real possibility in your program, use them: they are explicit, they behave identically in debug and release, and the reader can see which policy you chose. `checked_*` is usually the right one, because it forces you to decide what to do about the failure.",
        },
      ],
      pitfalls: [
        {
          title: "Subtracting from an unsigned integer is the usual way to hit this",
          body: "`let n: usize = 0; n - 1` panics in debug and wraps to 18446744073709551615 in release. Since `usize` is the type of every length, `items.len() - 1` on an empty collection is a genuinely common bug. Reach for `checked_sub`, or check for emptiness first.",
        },
      ],
    },
    {
      id: "floats",
      heading: "Floating point: f32 and f64",
      body: [
        "Two types, both IEEE 754: `f32` is single precision and `f64` is double. **`f64` is the default**, because on modern processors it is the same speed as `f32` and carries roughly twice the precision.",
        "Everything you already know about floating point applies here — Rust does not fix the representation, it just does not hide it. Values that are not exactly representable in binary are stored as the nearest thing that is, and errors accumulate.",
        "Rust does make one thing louder than most languages: **you cannot sort floats with the ordinary `sort`**, because `f64` does not implement the total-ordering trait. `NaN` is not equal to itself and is not ordered against anything, so there is no total order to implement. You have to use `sort_by` with `partial_cmp`, or `total_cmp`, and in doing so you are forced to acknowledge that NaN exists.",
      ],
      examples: [
        {
          id: "float-precision",
          title: "Precision, division, and the classic surprise",
          lang: "rust",
          code: `fn main() {
    let x = 0.1_f64 + 0.2_f64;
    println!("0.1 + 0.2 = {x}");
    println!("equal to 0.3? {}", x == 0.3);

    let single: f32 = 1.0 / 3.0;
    let double: f64 = 1.0 / 3.0;
    println!("f32: {single}");
    println!("f64: {double}");

    // Integer division truncates; float division does not.
    println!("7 / 2 = {}", 7 / 2);
    println!("7.0 / 2.0 = {}", 7.0 / 2.0);
    println!("7 % 2 = {}", 7 % 2);
    println!("-7 / 2 = {}", -7 / 2);
}`,
          output: `0.1 + 0.2 = 0.30000000000000004
equal to 0.3? false
f32: 0.33333334
f64: 0.3333333333333333
7 / 2 = 3
7.0 / 2.0 = 3.5
7 % 2 = 1
-7 / 2 = -3`,
          explanation:
            "Note that `7 / 2` is 3 and `-7 / 2` is -3: Rust truncates towards zero, like C and unlike Python's floor division. Never compare floats with `==`; compare the absolute difference against a tolerance you have chosen for the problem, or work in fixed-point integers if you are handling money.",
        },
      ],
      pitfalls: [
        {
          title: "Rust will not mix numeric types for you",
          body: "`let x = 3; let y = 2.5; x + y` does not compile — there is no implicit promotion from integer to float anywhere in the language. You write `x as f64 + y`. This is verbose exactly once per expression and eliminates an entire category of silent precision loss.",
        },
      ],
    },
    {
      id: "bool-char",
      heading: "Booleans and characters",
      body: [
        "`bool` is `true` or `false`, one byte, and that is the whole story — except for one rule worth stating explicitly: **there is no truthiness in Rust.** An `if` requires a `bool`, full stop. `if 1` does not compile, `if some_option` does not compile, and neither does `if !string.is_empty()` shortened to `if string`.",
        "`char` is more interesting than it looks. A Rust `char` is **four bytes** and holds a single *Unicode scalar value* — not a byte, and not a UTF-16 code unit as in Java or JavaScript. `'é'` is one `char`. So is `'🦀'`. So is `'中'`.",
        "This is one of the few places Rust chooses a bigger representation for correctness. The consequence to remember: a `char` is not a piece of a `String`. Strings are stored as UTF-8, where a character occupies between one and four bytes, so you cannot index a string by character position in constant time — and Rust therefore does not let you index a string at all. That gets a full lesson in module 5.",
      ],
      examples: [
        {
          id: "bool-char-cast",
          title: "Booleans, characters, and explicit casts",
          lang: "rust",
          code: `fn main() {
    let yes: bool = true;
    let no = 1 > 2;
    println!("{yes} {no}");

    let letter: char = 'R';
    let accented = 'é';
    let emoji = '🦀';
    println!("{letter} {accented} {emoji}");
    println!("a char is {} bytes", std::mem::size_of::<char>());
    println!("emoji as u32: {}", emoji as u32);

    // \`as\` truncates without complaint. 300 does not fit in a u8.
    let big: i64 = 300;
    let truncated = big as u8;
    println!("300 as u8 = {truncated}");

    // Float to integer truncates towards zero.
    let f = 3.99_f64;
    println!("3.99 as i32 = {}", f as i32);
}`,
          output: `true false
R é 🦀
a char is 4 bytes
emoji as u32: 129408
300 as u8 = 44
3.99 as i32 = 3`,
          explanation:
            "Single quotes are for `char` and double quotes are for `&str` — they are different types, not a stylistic choice. And note the last two lines: `as` is the one place Rust will quietly lose data for you. 300 becomes 44 because only the low eight bits survive.",
        },
      ],
      pitfalls: [
        {
          title: "`as` is the unchecked cast, and it is easy to over-use",
          body: "`as` never fails and never warns; it truncates, it saturates float-to-int conversions at the limits, and it will happily turn a large `u64` into a small negative `i32`. When the conversion should always succeed, prefer `From`/`Into` (`let x: i64 = y.into();`), which only compiles when the conversion is lossless. When it might fail, prefer `TryFrom` (`u8::try_from(n)`), which returns a `Result` you have to handle. Save `as` for the cases where truncation is what you actually meant.",
        },
      ],
    },
  ],
  takeaways: [
    "`i32` is the default integer, `f64` the default float, and `usize` is the type of every length and index",
    "Integer overflow panics in debug builds and wraps in release builds — never rely on either; use checked_*, saturating_* or wrapping_* when it matters",
    "`items.len() - 1` on an empty collection is the classic unsigned-underflow bug",
    "Floats are IEEE 754 with all the usual consequences; `0.1 + 0.2 != 0.3`, and floats cannot be sorted with plain `sort` because of NaN",
    "There is no truthiness and no implicit numeric conversion anywhere in the language",
    "A `char` is four bytes and holds one Unicode scalar value, which is why strings cannot be indexed",
    "`as` truncates silently — prefer `.into()` when the conversion is lossless and `try_from` when it can fail",
  ],
  status: "available",
};
