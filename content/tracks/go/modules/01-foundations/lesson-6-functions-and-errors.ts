import type { Lesson } from "@/content/types";

export const functionsAndErrorsLesson: Lesson = {
  id: "go-functions-and-errors",
  slug: "functions-control-flow-and-errors",
  moduleSlug: "foundations",
  title: "Functions, Control Flow & Errors as Values",
  summary:
    "Multiple return values, the control-flow shapes Go gives you (fewer than you expect), and the error-handling convention that defines what Go code looks like.",
  estimatedMinutes: 40,
  objectives: [
    "Write functions with multiple return values and use them",
    "Use the one loop keyword in all four of its forms",
    "Write a switch without fallthrough, and a tagless switch",
    "Handle errors as values, and know when to wrap them",
    "Read a Go panic and know when panicking is appropriate",
  ],
  sections: [
    {
      id: "functions",
      heading: "Functions, and returning more than one thing",
      body: [
        "Multiple return values are built into the language rather than simulated with a tuple or an out-parameter, and this is what makes Go's error handling possible: a function returns *its result* and *whether it worked*, side by side.",
      ],
      examples: [
        {
          id: "functions",
          title: "Signatures, closures, and variadics",
          lang: "go",
          code: `package main

import (
	"errors"
	"fmt"
)

func divide(a, b int) (int, error) {
	if b == 0 {
		return 0, errors.New("division by zero")
	}
	return a / b, nil
}

func minMax(xs []int) (min, max int) {
	min, max = xs[0], xs[0]
	for _, v := range xs {
		if v < min {
			min = v
		}
		if v > max {
			max = v
		}
	}
	return
}

func sum(nums ...int) int {
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}

func makeCounter() func() int {
	n := 0
	return func() int {
		n++
		return n
	}
}

func main() {
	q, err := divide(10, 3)
	fmt.Println(q, err)

	_, err = divide(1, 0)
	if err != nil {
		fmt.Println("failed:", err)
	}

	lo, hi := minMax([]int{3, 1, 4, 1, 5})
	fmt.Println(lo, hi)

	fmt.Println(sum(), sum(1, 2, 3))

	double := func(n int) int { return n * 2 }
	fmt.Println(double(21))

	counter := makeCounter()
	fmt.Println(counter(), counter(), counter())
}`,
          output: `3 <nil>
failed: division by zero
1 5
0 6
42
1 2 3`,
          explanation:
            "`func divide(a, b int)` gives both parameters the type written once. `minMax` uses **named results** — `(min, max int)` declares them as variables, so the bare `return` at the end returns whatever they currently hold. Named results are best kept for short functions; in a long one, a bare `return` makes the reader scroll to find out what is being returned. `sum(nums ...int)` is variadic, and calling it with no arguments gives an empty slice rather than nil trouble. `makeCounter` returns a closure that keeps `n` alive between calls.",
        },
      ],
    },
    {
      id: "control-flow",
      heading: "One loop keyword, four loops",
      body: [
        "Go has `for` and nothing else. No `while`, no `do-while`, no ternary operator. The four forms are the three-clause loop, the condition-only loop, the bare infinite loop, and `range`.",
      ],
      examples: [
        {
          id: "flow",
          title: "Every loop shape, and switch",
          lang: "go",
          code: `package main

import "fmt"

func classify(n int) string {
	switch {
	case n < 0:
		return "negative"
	case n == 0:
		return "zero"
	default:
		return "positive"
	}
}

func main() {
	for i := 0; i < 3; i++ {
		fmt.Print(i, " ")
	}
	fmt.Println()

	n := 0
	for n < 3 {
		n++
	}
	fmt.Println("while-style:", n)

	count := 0
	for {
		count++
		if count == 5 {
			break
		}
	}
	fmt.Println("infinite + break:", count)

	for i, ch := range "abc" {
		fmt.Print(i, string(ch), " ")
	}
	fmt.Println()

	fmt.Println(classify(-2), classify(0), classify(9))

	day := 3
	switch day {
	case 1, 7:
		fmt.Println("weekend")
	case 2, 3, 4, 5, 6:
		fmt.Println("weekday")
	}

	if v := 10 * 2; v > 15 {
		fmt.Println("scoped to the if:", v)
	}

	total := 0
	for i := 1; i <= 10; i++ {
		if i%2 == 0 {
			continue
		}
		total += i
	}
	fmt.Println("odd total:", total)
}`,
          output: `0 1 2 
while-style: 3
infinite + break: 5
0a 1b 2c 
negative zero positive
weekday
scoped to the if: 20
odd total: 25`,
          explanation:
            "Note what is *missing*: no parentheses around any condition, and braces are mandatory even for a one-line body. `switch` does **not** fall through — each case breaks implicitly, which is the opposite of C and removes a classic bug. A case may list several values. A `switch` with no subject, as in `classify`, is Go's replacement for a long if/else chain and reads considerably better. And `if v := ...; cond` scopes `v` to the `if` and its `else`, which keeps short-lived variables out of the surrounding function.",
        },
      ],
    },
    {
      id: "errors",
      heading: "Errors are values",
      body: [
        "Go has no exceptions. A function that can fail returns an `error` as its last result, and the caller checks it. `error` is an ordinary interface with a single method, so any type with an `Error() string` method is one.",
        "The convention is rigid and worth following exactly: **the error is the last return value**, and `nil` means success. Check it immediately, and handle it before doing anything else.",
        "The much-mocked `if err != nil { return err }` is what Go code looks like. What it buys you is that every failure path is written down at the point it can happen — there is no invisible unwinding, and no wondering which of the twelve calls in a function might throw.",
      ],
      pitfalls: [
        {
          title: "Do not ignore an error with `_`",
          body: "`v, _ := strconv.Atoi(input)` compiles and silently gives you `0` for bad input. That is almost never what you want, and it is the one place where Go's usually helpful unused-variable rule does not protect you. Handle it, or return it.",
        },
        {
          title: "Wrap with `%w`, not `%v`",
          body: "`fmt.Errorf(\"loading config: %w\", err)` keeps the original error inspectable through `errors.Is` and `errors.As`. Using `%v` instead flattens it to a string and throws that away.",
        },
      ],
    },
    {
      id: "panic",
      heading: "Panics, and when they are appropriate",
      body: [
        "A panic unwinds the stack and crashes the program. It is for *programmer* errors — a broken invariant, an impossible state — not for expected failures like a missing file or bad user input.",
        "The runtime panics on your behalf for a handful of things, and you should recognise the messages.",
      ],
      examples: [
        {
          id: "panic",
          title: "An out-of-range index",
          lang: "go",
          code: `package main

import "fmt"

func main() {
	xs := []int{1, 2, 3}
	fmt.Println(xs[5])
}`,
          output: `panic: runtime error: index out of range [5] with length 3

goroutine 1 [running]:
main.main()
	main.go:7 +0x17
exit status 2`,
          explanation:
            "Read it top down: the message says what went wrong, then the goroutine that failed, then the call stack with file and line. `exit status 2` is what `go run` reports for a panicking program. Unlike C, this is a clean crash with a diagnostic rather than silent memory corruption — Go bounds-checks every slice access.",
        },
      ],
    },
  ],
  takeaways: [
    "Multiple return values are the mechanism that makes error-as-value work",
    "`for` is the only loop keyword, in four forms; there is no ternary operator",
    "`switch` does not fall through, and a subject-less switch replaces if/else chains",
    "Conditions take no parentheses and bodies always take braces",
    "The error is the last return value and `nil` means success — check it immediately",
    "Wrap errors with `%w` so `errors.Is` still works",
    "Panic for broken invariants, not for expected failures",
  ],
  status: "available",
};
