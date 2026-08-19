import type { Lesson } from "@/content/types";

export const variablesLesson: Lesson = {
  id: "go-variables",
  slug: "variables-constants-and-zero-values",
  moduleSlug: "foundations",
  title: "Variables, Constants & the Zero Value",
  summary:
    "The three ways to declare a variable and when each is right, why Go refuses to compile an unused one, and the guarantee that removes a whole category of bug: every variable starts at a defined value.",
  estimatedMinutes: 30,
  objectives: [
    "Declare variables with var and with :=, and choose between them",
    "State the zero value of every basic type",
    "Explain why unused variables are a compile error",
    "Declare constants, and know what untyped constants buy you",
    "Swap two variables without a temporary",
  ],
  sections: [
    {
      id: "three-ways",
      heading: "Three declarations, one of which you will use most",
      body: [
        "Go gives you a long form, an inferred form, and a short form. They differ in how much you write, not in what you get.",
        "`:=` only works inside a function; package-level declarations need `var`",
        "`var x int` with no initialiser gives you the zero value",
        "`x, y = y, x` swaps without a temporary, because the right side is fully evaluated first",
      ],
      examples: [
        {
          id: "declarations",
          title: "Declaring variables",
          lang: "go",
          code: `package main

import "fmt"

func main() {
	var explicit int = 42
	var inferred = 42
	short := 42
	var zero int
	var empty string
	var flag bool
	var pi float64

	fmt.Println(explicit, inferred, short)
	fmt.Println("zero values:", zero, empty == "", flag, pi)

	const Greeting = "hi"
	const Big = 1 << 20
	fmt.Println(Greeting, Big)

	var a, b, c = 1, "two", 3.0
	fmt.Println(a, b, c)

	x, y := 1, 2
	x, y = y, x
	fmt.Println("swapped:", x, y)
}`,
          output: `42 42 42
zero values: 0 true false 0
hi 1048576
1 two 3
swapped: 2 1`,
          explanation:
            "All three of the first declarations produce an identical `int`. Use `:=` inside functions — it is what almost all Go code does. Use `var` when you need the zero value with no initialiser, when the type must be stated because inference would pick the wrong one, or at package level, where `:=` is not allowed at all.",
        },
      ],
    },
    {
      id: "zero-values",
      heading: "The zero value guarantee",
      body: [
        "Every variable in Go is initialised. There is no such thing as reading uninitialised memory, and no `undefined`, `null` or garbage value to trip over. Declare a variable without a value and you get a defined, useful one:",
        "Numbers — `int`, `float64`, and all their widths — start at `0`",
        "`bool` starts at `false`",
        "`string` starts at `\"\"`, the empty string, never nil",
        "Pointers, slices, maps, channels, functions and interfaces start at `nil`",
        "A struct starts as a struct with every field at *its* zero value",
        "This is not merely a safety feature; it is a design principle you will see exploited throughout the standard library. A zero-valued `sync.Mutex` is a ready-to-use unlocked mutex. A zero-valued `bytes.Buffer` is a ready-to-use empty buffer. Types in Go are routinely designed so that their zero value is immediately useful, which is why you see so little constructor code.",
      ],
      pitfalls: [
        {
          title: "A nil map can be read but not written",
          body: "The zero value of a map is `nil`, and reading from it is legal — you get the zero value of the element type. *Writing* to it panics with `assignment to entry in nil map`. A map must be made before you put anything in it, with `make(map[string]int)` or a literal `map[string]int{}`. Slices are more forgiving: `append` works on a nil slice.",
        },
      ],
    },
    {
      id: "unused",
      heading: "Unused variables do not compile",
      body: [
        "This is the rule that most annoys newcomers, and the one they most often come to appreciate. Declare a variable you never read, and the build fails.",
        "Assign to `_`, the blank identifier, when you genuinely need to discard something",
        "Unused *function parameters* and *package-level* variables are fine — the rule is only for locals",
      ],
      examples: [
        {
          id: "unused-var",
          title: "A declared-and-not-used error",
          lang: "go",
          code: `package main

import "fmt"

func main() {
	count := 10
	fmt.Println("hello")
}`,
          output: `# command-line-arguments
main.go:6:2: declared and not used: count`,
          explanation:
            "The compiler is pointing at a genuine signal: an unused variable is usually either a leftover from code you deleted, or a sign you meant to use it and used something else. Go's designers decided this is common enough to be worth refusing outright rather than emitting a warning nobody reads.",
        },
        {
          id: "unused-import",
          title: "The same rule for imports",
          lang: "go",
          code: `package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Println("hi")
}`,
          output: `# command-line-arguments
main.go:5:2: "os" imported and not used`,
          explanation:
            "This one is also about build speed. An unused import still has to be located, read and type-checked, and in a large codebase the accumulated cost is real. Your editor's Go plugin will add and remove imports automatically, so in practice you will rarely see this error after the first week.",
        },
      ],
    },
    {
      id: "constants",
      heading: "Constants, and the untyped kind",
      body: [
        "A `const` is fixed at compile time and may only hold a value the compiler can compute: numbers, strings, booleans and characters. You cannot make a slice or a map constant.",
        "The interesting part is that a constant declared without a type is **untyped**, and takes on whichever type the place it is used needs. `const Big = 1 << 20` is not an `int` — it is an untyped integer constant that becomes an `int`, an `int64` or a `float64` depending on context. That is why it can be assigned to any numeric variable without a conversion, which ordinary Go values very much cannot.",
      ],
      pitfalls: [
        {
          title: "Constants are compile-time only",
          body: "`const now = time.Now()` will not compile — a function call cannot be evaluated by the compiler. Use `var` for anything computed at run time.",
        },
      ],
    },
  ],
  takeaways: [
    "`:=` inside functions, `var` when you need the zero value or a package-level declaration",
    "Every variable is initialised; there is no uninitialised memory in Go",
    "Well-designed Go types make their zero value immediately usable",
    "An unused local variable or import is a compile error, not a warning",
    "Untyped constants adapt to the type of the context they are used in",
  ],
  status: "available",
};
