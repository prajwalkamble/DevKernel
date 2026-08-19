import type { Lesson } from "@/content/types";

export const basicTypesLesson: Lesson = {
  id: "go-basic-types",
  slug: "numbers-strings-runes-and-bytes",
  moduleSlug: "foundations",
  title: "Numbers, Strings, Runes & Bytes",
  summary:
    "Go's numeric types and the conversions it refuses to do for you, then the part that catches everyone: a Go string is a sequence of bytes, and indexing one does not give you a character.",
  estimatedMinutes: 35,
  objectives: [
    "Choose between int, int64 and the sized integer types",
    "Explain why Go requires an explicit conversion between numeric types",
    "Describe what a string actually holds, and what len reports",
    "Distinguish a byte from a rune, and index a string safely",
    "Iterate a string by character rather than by byte",
  ],
  sections: [
    {
      id: "numbers",
      heading: "The numeric types",
      body: [
        "Go has signed integers `int8`, `int16`, `int32`, `int64`, their unsigned counterparts `uint8` through `uint64`, and the floats `float32` and `float64`. It also has plain `int` and `uint`, whose width matches the platform — 64 bits on anything you are likely to be using.",
        "**Use `int` unless you have a reason not to.** It is the idiomatic default, it is what `len` returns, and it is what a loop counter should be. Reach for a sized type when the size is part of the problem: a binary file format, a network protocol, or a memory budget that genuinely matters.",
        "Integer overflow **wraps silently** — it is defined behaviour, not undefined as in C, but it is still almost never what you wanted.",
      ],
      examples: [
        {
          id: "numeric-types",
          title: "Widths, wrapping, and float precision",
          lang: "go",
          code: `package main

import "fmt"

func main() {
	var i8 int8 = 127
	var u8 uint8 = 255
	var i64 int64 = 9223372036854775807
	fmt.Println(i8, u8, i64)

	i8++
	fmt.Println("int8 overflow wraps:", i8)

	var f float64 = 0.1
	fmt.Println("0.1+0.2 ==", f+0.2, f+0.2 == 0.3)

	n := 7
	d := float64(n) / 2
	fmt.Println("int div:", n/2, "float div:", d)
}`,
          output: `127 255 9223372036854775807
int8 overflow wraps: -128
0.1+0.2 == 0.30000000000000004 false
int div: 3 float div: 3.5`,
          explanation:
            "`127 + 1` in an `int8` gives `-128`, wrapping around to the bottom of the range. The float comparison is not a Go quirk — it is IEEE 754, and it behaves identically in every language on this site. And `7 / 2` is `3`, because integer division truncates; you get `3.5` only by converting to a float *before* dividing.",
        },
      ],
      pitfalls: [
        {
          title: "Go will not convert numeric types for you",
          body: "`var a int = 1; var b int64 = 2; a + b` does not compile — `invalid operation: mismatched types int and int64`. This is deliberate: implicit numeric conversion is a well-known source of silent precision loss, so Go makes you write `int64(a) + b` and say which one you meant. It is the same reason `float64(n) / 2` above needs the conversion spelled out.",
        },
      ],
    },
    {
      id: "strings-are-bytes",
      heading: "A string is a read-only slice of bytes",
      body: [
        "This is the single most important thing to understand about Go strings, and the source of most beginner bugs.",
        "A Go string does not hold characters. It holds **bytes**, conventionally encoded as UTF-8. That has three consequences: `len(s)` counts bytes rather than characters, `s[i]` yields a single byte rather than a character, and strings are immutable — you cannot assign to `s[i]` at all.",
      ],
      examples: [
        {
          id: "string-bytes",
          title: "What len and indexing actually give you",
          lang: "go",
          code: `package main

import "fmt"

func main() {
	s := "héllo"
	fmt.Println("len (bytes):", len(s))
	fmt.Println("runes:", len([]rune(s)))
	fmt.Println("s[0] is a byte:", s[0])
	fmt.Printf("%c %T\\n", s[0], s[0])

	for i, r := range "gö" {
		fmt.Printf("index %d rune %c code %d\\n", i, r, r)
	}
}`,
          output: `len (bytes): 6
runes: 5
s[0] is a byte: 104
h uint8
index 0 rune g code 103
index 1 rune ö code 246`,
          explanation:
            "`\"héllo\"` is five characters but six bytes, because `é` needs two in UTF-8. `s[0]` prints as `104` — the *number* 104 — because a byte is a `uint8` and `Println` shows it as one; `%c` is what renders it as `h`. And notice the `range` loop: it yields **runes**, not bytes, and the index jumps by the width of each one.",
        },
      ],
    },
    {
      id: "byte-vs-rune",
      heading: "byte and rune",
      body: [
        "Both are aliases for integer types, and the names exist to say what you mean.",
        "**`byte`** is an alias for `uint8`. It is one octet of data. `[]byte` is what you use for binary data, for file contents, and for building strings efficiently.",
        "**`rune`** is an alias for `int32`. It holds one Unicode code point. `[]rune` is what you convert a string to when you genuinely need to work character by character — reversing a string, say, or checking whether it is a palindrome.",
        "The rule of thumb: if the problem is about *text*, convert to `[]rune`. If it is about *data* or you know the input is ASCII, `[]byte` is faster and allocates less. And in a DSA problem where the input is stated to be lowercase English letters, indexing bytes directly is both correct and idiomatic.",
      ],
      pitfalls: [
        {
          title: "Reversing a string by bytes corrupts non-ASCII text",
          body: "Reverse `\"héllo\"` byte by byte and the two bytes of `é` end up in the wrong order, producing invalid UTF-8. Convert to `[]rune` first, reverse that, and convert back. The bug is invisible in testing if every test input is ASCII, which is exactly how it reaches production.",
        },
      ],
    },
    {
      id: "conversions",
      heading: "Converting between them",
      body: [
        "`string(bs)` turns a `[]byte` or `[]rune` back into a string. `[]byte(s)` and `[]rune(s)` go the other way. All three copy — strings are immutable, so there is no way to share the storage.",
        "One trap worth naming: `string(65)` is not `\"65\"`. It is `\"A\"`, because converting an integer to a string interprets it as a code point. To render a number as text you want `strconv.Itoa(65)`, or `fmt.Sprintf(\"%d\", 65)`. `go vet` will warn about the first form, which is one good reason to run it.",
      ],
    },
  ],
  takeaways: [
    "Use `int` by default; reach for a sized type only when the size is part of the problem",
    "Integer overflow wraps silently, and integer division truncates",
    "Go never converts numeric types implicitly — you write the conversion",
    "A string holds bytes: `len` counts bytes and `s[i]` is a byte, not a character",
    "`range` over a string yields runes and skips by their width",
    "`byte` is `uint8` for data; `rune` is `int32` for text",
    "`string(65)` is `\"A\"`, not `\"65\"` — use `strconv.Itoa`",
  ],
  status: "available",
};
