import type { Lesson } from "@/content/types";

export const whatIsGoLesson: Lesson = {
  id: "go-what-is-go",
  slug: "what-go-is-and-why",
  moduleSlug: "foundations",
  title: "What Go Is, and What It Is For",
  summary:
    "Where Go came from, the three problems it was built to solve, and an honest account of what it gives up to solve them — so you can tell whether it is the right tool before you learn it.",
  estimatedMinutes: 25,
  objectives: [
    "Say what problem Go was designed to solve, and for whom",
    "Name the three properties Go optimises for above all others",
    "Explain what Go deliberately leaves out, and the reasoning",
    "Decide whether Go suits a given project",
    "Recognise Go code on sight",
  ],
  sections: [
    {
      id: "origin",
      heading: "A language designed against a specific frustration",
      body: [
        "Go came out of Google in 2009, designed by Robert Griesemer, Rob Pike and Ken Thompson. The origin story is unusually concrete: they were waiting for a C++ build. Google's codebase had grown to the point where compiling a large binary took the better part of an hour, and the languages available made a bad trade — you could have fast execution and slow builds with C++, or fast builds and slow execution with Python.",
        "So the goal was not elegance, and it was certainly not novelty. Go's designers were explicit that they wanted a language that was **boring on purpose**: one a new team member could read on their first day, that compiled in seconds, and that ran fast enough to sit in front of production traffic.",
        "That history explains almost every design decision you are about to meet. When something in Go seems oddly restrictive, the answer is usually that a more flexible version would have cost compile time, readability, or both.",
      ],
    },
    {
      id: "three-properties",
      heading: "The three things Go optimises for",
      body: [
        "**Compilation speed.** Go builds are measured in seconds, not minutes. The language has no header files, forbids circular imports, and refuses to compile a file with an unused import — all of which exist so the compiler never has to do work twice or guess at dependencies.",
        "**Readability over expressiveness.** There is usually one way to write a thing, and `gofmt` decides how it is laid out. This is a real trade: Go code is more verbose than the equivalent Python or Rust. The bet is that code is read far more often than it is written, and that a team of thirty people is better served by uniformity than by everyone's favourite idiom.",
        "**Concurrency as a first-class feature.** Goroutines and channels are built into the language rather than bolted on through a library. Starting a concurrent task is one keyword — `go doWork()` — and costs a couple of kilobytes rather than a megabyte-sized OS thread.",
        "Fast builds are a language design goal, not an implementation detail",
        "One obvious way to do it, and `gofmt` settles all formatting arguments",
        "Concurrency is in the language, not in a library",
        "Deployment is a single static binary with no runtime to install",
      ],
    },
    {
      id: "what-it-gives-up",
      heading: "What Go leaves out, on purpose",
      body: [
        "An honest account matters more than a sales pitch, because these omissions are the reason people bounce off Go.",
        "**Exceptions.** Go returns errors as ordinary values, so you will write `if err != nil` a great deal. Critics find it noisy; defenders point out that every error path is visible at the call site rather than hidden in a stack unwind.",
        "**Inheritance.** There are no classes and no subclassing. Go composes structs and satisfies interfaces implicitly — a type implements an interface simply by having the right methods, with nothing to declare.",
        "**Generics, until recently.** Go shipped without them for thirteen years, and only added them in 1.18 (2022). They exist now but are used sparingly; a lot of Go code you meet predates them.",
        "**Manual memory management.** Go is garbage collected. That rules it out for the hardest real-time work, and rules it in for almost everything else.",
      ],
      pitfalls: [
        {
          title: "Do not judge `if err != nil` before you have written a real program",
          body: "It is the single most-complained-about thing in Go, and the complaint is nearly always made from the outside. The reason it survives is that it makes the failure path *local and visible* — you can read a Go function top to bottom and see everything that can go wrong. Reserve judgement until you have debugged a production incident in it.",
        },
      ],
    },
    {
      id: "recognise",
      heading: "Recognising Go on sight",
      body: [
        "A few surface features make Go unmistakable. Types come *after* names. There are no semicolons. Exported names start with a capital letter — that is the entire access-control system. And the short declaration operator `:=` is everywhere.",
      ],
      examples: [
        {
          id: "go-shape",
          title: "The shape of a Go program",
          lang: "go",
          code: `package main

import "fmt"

// Exported: the capital G is what makes this visible to other packages.
func Greet(name string) string {
	return "Hello, " + name + "!"
}

func main() {
	message := Greet("world")
	fmt.Println(message)
}`,
          output: `Hello, world!`,
          explanation:
            "Read `name string` as \"name, which is a string\". The type follows the name here and everywhere else, including in `func Greet(...) string` where the return type comes last. `:=` declares `message` and infers its type in one step. There is not a semicolon in sight — the compiler inserts them for you at the end of each line, which is also why Go insists that an opening brace shares a line with what it belongs to.",
        },
      ],
    },
    {
      id: "when",
      heading: "When to reach for Go, and when not to",
      body: [
        "Go is a strong default for network services, command-line tools, and anything that has to be deployed widely — the single static binary means no runtime to install and no dependency hell on the target machine. It is the language of Docker, Kubernetes, Terraform and Prometheus, which is not a coincidence: all four are infrastructure tools that people install everywhere.",
        "It is a poor fit for hard real-time systems, where the garbage collector's pauses are unacceptable, and for numerical and scientific computing, where the ecosystem is thin and Python's is enormous. For browser front-ends it is largely irrelevant.",
        "Excellent: network services, CLI tools, infrastructure, anything deployed widely",
        "Poor: hard real-time, scientific computing, front-end web",
        "The static binary is a bigger practical advantage than it first sounds",
      ],
    },
  ],
  takeaways: [
    "Go was designed against slow builds and unreadable large codebases, not to be novel",
    "It optimises for compile speed, readability and built-in concurrency",
    "It deliberately omits exceptions, inheritance and manual memory management",
    "Types follow names, there are no semicolons, and capitalisation controls visibility",
    "It is the default choice for infrastructure and network services",
  ],
  status: "available",
};
