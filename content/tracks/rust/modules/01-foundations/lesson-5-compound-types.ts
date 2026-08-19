import type { Lesson } from "@/content/types";

export const compoundTypesLesson: Lesson = {
  id: "rust-compound-types",
  slug: "tuples-arrays-slices",
  moduleSlug: "foundations",
  title: "Compound Types: Tuples, Arrays & a First Look at Slices",
  summary:
    "The two ways Rust groups values without allocating: tuples for a fixed set of differently-typed things, arrays for a fixed number of identical things — plus slices, the borrowed view that makes arrays usable.",
  estimatedMinutes: 30,
  objectives: [
    "Build and destructure tuples, and use them for multiple return values",
    "Declare arrays, including the repeat form, and know that the length is part of the type",
    "Explain why arrays live on the stack and Vec lives on the heap",
    "Understand what a slice is and why functions take one instead of an array",
    "Know how Rust handles an out-of-bounds index, and when it catches it at compile time",
  ],
  sections: [
    {
      id: "tuples",
      heading: "Tuples: a fixed group of possibly-different types",
      body: [
        "A tuple collects a fixed number of values, each of which may be a different type. The types and the count are part of the tuple's own type: `(i32, i32, &str)` is a different type from `(i32, &str, i32)`, and neither can be used where the other is expected.",
        "Tuples cost nothing at runtime — a tuple is just its fields laid out next to each other, with no header and no indirection. They are the natural way to return more than one value from a function, and they are what a function returning nothing actually returns: the empty tuple `()`, called the **unit type**.",
        "Access fields by position with a dot and a number (`point.0`), or — much more commonly — take them apart with **destructuring**, which is a pattern match and is the idiomatic way to use them.",
      ],
      examples: [
        {
          id: "tuple-basics",
          title: "Building, destructuring, and indexing",
          lang: "rust",
          code: `fn main() {
    let point: (i32, i32, &str) = (3, 7, "origin-ish");

    // Destructuring: one binding per field, named by you.
    let (x, y, label) = point;
    println!("x={x} y={y} label={label}");

    // Positional access, when destructuring would be overkill.
    println!("first field again: {}", point.0);

    // The unit type: zero fields. This is what \`fn\` returns by default.
    let unit = ();
    println!("the unit value prints as {unit:?}");

    // Tuples nest, and the field syntax chains.
    let nested = ((1, 2), (3, 4));
    println!("nested.1.0 = {}", nested.1.0);
}`,
          output: `x=3 y=7 label=origin-ish
first field again: 3
the unit value prints as ()
nested.1.0 = 3`,
          explanation:
            "Destructuring is not special syntax for tuples — it is the same pattern-matching machinery that `match` uses, and it works in `let`, in function parameters, and in `for` loops. You will see it constantly from module 4 onwards.",
        },
        {
          id: "tuple-return",
          title: "Returning two values without inventing a struct",
          lang: "rust",
          code: `fn min_max(values: &[i32]) -> (i32, i32) {
    let mut smallest = values[0];
    let mut largest = values[0];

    for &value in values {
        if value < smallest {
            smallest = value;
        }
        if value > largest {
            largest = value;
        }
    }

    (smallest, largest) // no \`return\` needed: the last expression is the value
}

fn main() {
    let readings = [17, -4, 92, 33, 0];
    let (low, high) = min_max(&readings);
    println!("low={low} high={high}");
}`,
          output: `low=-4 high=92`,
          explanation:
            "Two things arrive here early on purpose. The function body ends with an expression and no semicolon, which is how a Rust function returns a value. And the parameter is `&[i32]` — a slice — rather than an array, which is the subject of the last section of this lesson.",
        },
      ],
      pitfalls: [
        {
          title: "A tuple with more than three fields is usually a struct waiting to happen",
          body: "`(String, u32, bool, f64)` tells a reader nothing about what those fields mean, and `record.2` at the call site is worse. Tuples are for pairs and triples where the meaning is obvious from context. Beyond that, name the fields with a struct — module 4.",
        },
      ],
    },
    {
      id: "arrays",
      heading: "Arrays: a fixed number of identical values",
      body: [
        "An array holds a fixed number of elements, all of the same type, laid out contiguously. Its type is written `[T; N]` — and **`N`, the length, is part of the type**. `[i32; 5]` and `[i32; 6]` are different types, and a function that takes one will not accept the other.",
        "That is the crucial difference from most languages' arrays, and it follows from where the data lives: **an array is stored inline, on the stack**, so the compiler must know its exact size to lay out the frame. Nothing is allocated, nothing is freed, and there is no pointer to follow.",
        "If you need a collection that grows, you want `Vec<T>`, which allocates on the heap and is the type you will actually reach for most of the time. Arrays earn their place when the size is genuinely fixed and known — a lookup table, an RGB colour, a fixed-size buffer — or when you are avoiding allocation on purpose, as in embedded code.",
      ],
      examples: [
        {
          id: "array-basics",
          title: "Declaring, filling, indexing and iterating",
          lang: "rust",
          code: `fn main() {
    let primes = [2, 3, 5, 7, 11];   // inferred as [i32; 5]
    let zeros = [0u8; 4];            // repeat form: four copies of 0u8

    println!("primes has {} elements", primes.len());
    println!("primes[0] = {}", primes[0]);
    println!("zeros = {zeros:?}");
    println!("primes = {primes:?}");

    // Borrowing part of an array gives you a slice.
    let middle = &primes[1..4];
    println!("slice = {middle:?}, length {}", middle.len());

    let mut total = 0;
    for p in primes {
        total += p;
    }
    println!("sum = {total}");
}`,
          output: `primes has 5 elements
primes[0] = 2
zeros = [0, 0, 0, 0]
primes = [2, 3, 5, 7, 11]
slice = [3, 5, 7], length 3
sum = 28`,
          explanation:
            "`[0u8; 4]` is the repeat form: value, semicolon, count. The range `1..4` is half-open — it includes 1 and excludes 4 — which is why the slice has three elements. Use `1..=4` when you want the end included.",
        },
      ],
    },
    {
      id: "bounds",
      heading: "Out of bounds: sometimes a panic, sometimes a compile error",
      body: [
        "Rust checks every index against the length. There is no reading past the end of an array, which is the single most exploited bug class in C. What is worth knowing is *when* the check happens.",
        "If the index is a constant the compiler can evaluate, **the check happens at compile time** and you get an error rather than a program. If the index is computed at runtime, the check happens then, and going out of bounds **panics** — the program stops with a clear message rather than reading someone else's memory.",
        "The cost is a comparison and a branch per index. In loops the optimiser usually removes it entirely, having proved the index cannot escape the range — and where it matters, iterating with `for` instead of indexing avoids the question altogether.",
      ],
      examples: [
        {
          id: "bounds-compile",
          title: "A constant index is caught before the program exists",
          lang: "rust",
          code: `fn main() {
    let primes = [2, 3, 5, 7, 11];
    let index = 10;
    println!("{}", primes[index]);
}`,
          output: `error: this operation will panic at runtime
 --> main.rs:4:20
  |
4 |     println!("{}", primes[index]);
  |                    ^^^^^^^^^^^^^ index out of bounds: the length is 5 but the index is 10
  |
  = note: \`#[deny(unconditional_panic)]\` on by default`,
          explanation:
            "The `unconditional_panic` lint spotted that this index can only ever be out of range, and refused to build. This is a lint rather than a type error — it only fires when the compiler can prove the outcome.",
        },
        {
          id: "bounds-runtime",
          title: "A computed index is caught when it happens",
          lang: "rust",
          code: `fn main() {
    let primes = [2, 3, 5, 7, 11];
    // The compiler cannot know what this is, so the check moves to runtime.
    let index: usize = std::env::args().count() + 9;
    println!("{}", primes[index]);
}`,
          output: `thread 'main' (7588) panicked at src/main.rs:5:20:
index out of bounds: the len is 5 but the index is 10
note: run with \`RUST_BACKTRACE=1\` environment variable to display a backtrace`,
          explanation:
            "A panic is not undefined behaviour and not a security bug: the program stops deliberately, at a known point, with the file and line. When you would rather handle it than crash, `primes.get(index)` returns an `Option` instead — `None` for out of range — which module 4 covers properly.",
        },
      ],
    },
    {
      id: "slices",
      heading: "Slices: a borrowed window onto a sequence",
      body: [
        "Because the length is part of an array's type, a function taking `[i32; 5]` is useless — it works for exactly one size. The answer is the **slice**, written `&[T]`.",
        "A slice is a *view*: a pointer to some elements plus a count, borrowed from something that owns them. It does not own the data and it does not copy it. Critically, it does not care where the data came from — a slice can point into an array, into a `Vec`, or into part of either.",
        "That makes `&[T]` the right parameter type almost every time you want to accept a sequence. Write your functions against slices and they work with everything.",
      ],
      examples: [
        {
          id: "slice-generic",
          title: "One function, three kinds of caller",
          lang: "rust",
          code: `fn sum(values: &[i32]) -> i32 {
    let mut total = 0;
    for value in values {
        total += value;
    }
    total
}

fn main() {
    let array = [1, 2, 3, 4, 5];
    let vector = vec![10, 20, 30];

    println!("whole array:  {}", sum(&array));
    println!("part of it:   {}", sum(&array[1..3]));
    println!("a Vec:        {}", sum(&vector));
    println!("part of a Vec:{}", sum(&vector[..2]));
}`,
          output: `whole array:  15
part of it:   5
a Vec:        60
part of a Vec:30`,
          explanation:
            "One function, four call sites, no copying and no generics. `&array` becomes a slice automatically here — this is *deref coercion*, and it is why slices feel invisible in practice. Omitting either end of a range means \"from the start\" or \"to the end\", so `&vector[..2]` is the first two elements.",
        },
      ],
      pitfalls: [
        {
          title: "Slicing takes byte ranges on strings, not character ranges",
          body: "`&text[0..3]` on a `String` slices *bytes*, and panics at runtime if either end lands in the middle of a multi-byte UTF-8 character. It is the one place where slicing has a trap in it, and it is why module 5 gives strings a lesson of their own. For sequences of anything other than text, slicing behaves exactly as this lesson describes.",
        },
      ],
    },
  ],
  takeaways: [
    "Tuples group a fixed number of possibly-different types; destructuring is the idiomatic way to take them apart",
    "`()` is the unit type — the empty tuple, and what a function with no return value returns",
    "An array's length is part of its type: `[i32; 5]` and `[i32; 6]` are unrelated types, stored inline on the stack",
    "Use `Vec<T>` when the size is not known at compile time; arrays when it genuinely is fixed",
    "Indexing is always bounds-checked — at compile time when the index is a constant, at runtime with a panic otherwise",
    "`&[T]` is a borrowed view of a sequence and works for arrays, Vecs and parts of either — make it your default parameter type",
  ],
  status: "available",
};
