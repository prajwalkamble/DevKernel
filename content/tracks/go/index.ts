import type { TrackDefinition } from "@/content/types";
import { createComingSoonModule } from "@/content/comingSoon";
import { goFoundationsModule } from "./modules/01-foundations";

/**
 * Go, taught as the language infrastructure is written in.
 *
 * The syllabus follows Go's own priorities rather than a generic
 * language-tour order. Interfaces arrive early, in module 3, because implicit
 * satisfaction is the idea that makes Go's design click and everything after it
 * reads differently once you have it. Concurrency gets two modules rather than
 * one, because goroutines are easy and the memory model around them is not, and
 * a track that teaches only the easy half produces data races.
 *
 * There is no interview module. Go interviews are overwhelmingly about
 * concurrency and system design rather than language trivia, and both are
 * covered where they belong — in the concurrency modules and in the System
 * Design track.
 */
const soon = (input: Parameters<typeof createComingSoonModule>[0]) =>
  createComingSoonModule({ ...input, interviewPrep: false });

export const goTrack: TrackDefinition = {
  id: "go",
  slug: "go",
  title: "Go",
  shortTitle: "Go",
  tagline: "Small language, fast builds, and concurrency that fits in your head",
  description:
    "Go from nothing installed through to writing the kind of software Go is actually used for: network services, command-line tools and infrastructure. You meet interfaces early, because implicit satisfaction is the idea the rest of the language is built around, and concurrency gets the two modules it needs rather than the one that leaves people writing data races. Every module ends in programs you compile and run, and the track finishes on shipping a real service — testing, profiling, and the deployment story that made Go the default for this kind of work.",
  order: 8,
  status: "available",
  accent: "go",
  mode: "learn",
  lessonMinutes: [25, 40],
  interviewPrep: false,
  runnable: true,
  modules: [
    goFoundationsModule,
    soon({
      id: "go-methods-interfaces",
      slug: "methods-interfaces-and-composition",
      title: "Methods, Interfaces & Composition",
      order: 2,
      description:
        "The heart of Go's type system, and the module that changes how the rest of the language reads. No classes, no inheritance — methods on any named type, interfaces satisfied without declaring anything, and composition where other languages would subclass.",
      topics: [
        "Methods on named types, and why the receiver is not called `this`",
        "Value receivers against pointer receivers, and how to choose",
        "Interfaces, and satisfaction without a declaration",
        "Accepting interfaces and returning structs",
        "The empty interface, `any`, and what it costs",
        "Type assertions, the comma-ok form, and type switches",
        "Struct embedding, and why it is not inheritance",
        "The nil interface trap: why a nil pointer in an interface is not nil",
      ],
    }),
    soon({
      id: "go-errors-testing",
      slug: "errors-and-testing",
      title: "Errors, Panics & Testing",
      order: 3,
      description:
        "Error handling beyond `if err != nil`: sentinel errors, custom error types, wrapping and unwrapping. Then the testing package, which is in the standard library and needs no framework.",
      topics: [
        "Sentinel errors, and when a package should export one",
        "Custom error types, and implementing the error interface",
        "Wrapping with %w, and inspecting with errors.Is and errors.As",
        "defer, and the order deferred calls run in",
        "panic and recover, and why recover is rare in application code",
        "Writing tests with the testing package",
        "Table-driven tests, the dominant Go testing idiom",
        "Benchmarks, fuzzing, and go test -race",
      ],
    }),
    soon({
      id: "go-packages-modules",
      slug: "packages-modules-and-project-layout",
      title: "Packages, Modules & Project Layout",
      order: 4,
      description:
        "How Go code is organised at a scale bigger than one file: what a package is for, how visibility actually works, and the module system that replaced GOPATH.",
      topics: [
        "Packages as the unit of compilation and of visibility",
        "Exported and unexported names, and designing an API surface",
        "init functions, and why to avoid them",
        "Modules, semantic import versioning, and go.sum",
        "Adding, updating and vendoring dependencies",
        "internal/ and the visibility rule the compiler enforces",
        "Standard project layouts, and which conventions are real",
        "Documentation comments and pkg.go.dev",
      ],
    }),
    soon({
      id: "go-concurrency",
      slug: "goroutines-and-channels",
      title: "Goroutines & Channels",
      order: 5,
      description:
        "The feature Go is famous for. Goroutines cost a couple of kilobytes, channels move data between them, and select multiplexes. This module builds the model; the next one covers what goes wrong.",
      topics: [
        "Goroutines, and what makes them cheaper than threads",
        "Channels: unbuffered, buffered, and what each one synchronises",
        "Direction-typed channels in function signatures",
        "select, and the default case",
        "Closing channels, and ranging over one",
        "sync.WaitGroup, and waiting for a group of goroutines",
        "The worker pool, the fan-in and the fan-out patterns",
        "Share memory by communicating — and when to ignore that advice",
      ],
    }),
    soon({
      id: "go-concurrency-safety",
      slug: "concurrency-safety-and-context",
      title: "Concurrency Safety, Context & the Memory Model",
      order: 6,
      description:
        "The half that a one-module treatment leaves out. Races, the memory model, cancellation, and the leaks that only appear under load.",
      topics: [
        "Data races, and what the race detector can and cannot see",
        "sync.Mutex, RWMutex, and when a mutex beats a channel",
        "sync.Once, sync.Map, and the atomic package",
        "The Go memory model, and what happens-before actually guarantees",
        "context.Context: cancellation, deadlines and request values",
        "Goroutine leaks, and how to find them",
        "Timeouts, retries and graceful shutdown",
        "Profiling a concurrent program with pprof",
      ],
    }),
    soon({
      id: "go-stdlib",
      slug: "the-standard-library",
      title: "The Standard Library in Practice",
      order: 7,
      description:
        "Go's standard library is unusually complete, and knowing it is most of knowing Go. The packages you will reach for weekly, with the interfaces that tie them together.",
      topics: [
        "io.Reader and io.Writer, the two interfaces everything speaks",
        "strings, strconv, and bytes",
        "encoding/json, struct tags, and custom marshalling",
        "time: durations, formatting, and the reference-layout surprise",
        "sort, and the slices and maps packages",
        "os, path/filepath, and reading files without loading them whole",
        "regexp, and why it is slower than you expect",
        "log/slog for structured logging",
      ],
    }),
    soon({
      id: "go-generics",
      slug: "generics",
      title: "Generics",
      order: 8,
      description:
        "Added in Go 1.18 after thirteen years without them, and deliberately narrower than most languages'. What they can do, what they cannot, and why most Go code still does not need them.",
      topics: [
        "Type parameters on functions and on types",
        "Constraints, and the constraints in the standard library",
        "Type inference, and where it gives up",
        "Writing genuinely generic containers",
        "What generics deliberately cannot do in Go",
        "When an interface is the better answer",
        "The performance story: stenciling against dictionaries",
      ],
    }),
    soon({
      id: "go-http-services",
      slug: "building-http-services",
      title: "Building HTTP Services",
      order: 9,
      description:
        "The thing most Go is written for. net/http is in the standard library and is production-grade, so this module builds a real service on it rather than reaching for a framework.",
      topics: [
        "net/http: handlers, the ServeMux, and the routing added in 1.22",
        "Middleware as ordinary function composition",
        "Request parsing, validation and JSON responses",
        "Graceful shutdown, and timeouts that actually matter",
        "Talking to a database with database/sql",
        "Testing handlers with httptest",
        "Structured logging, metrics and health checks",
        "When a framework earns its place, and when it does not",
      ],
    }),
    soon({
      id: "go-shipping",
      slug: "shipping-go",
      title: "Shipping Go",
      order: 10,
      description:
        "Turning a program into software other people run: cross-compilation, small containers, profiling, and the tooling that keeps a codebase healthy.",
      topics: [
        "Cross-compiling with GOOS and GOARCH",
        "Build tags, ldflags, and stamping in a version",
        "Minimal containers: scratch, distroless, and why Go suits them",
        "Profiling CPU, memory and blocking with pprof",
        "Reducing allocations, and reading escape analysis",
        "Linting with staticcheck and golangci-lint",
        "Continuous integration for a Go module",
        "Publishing a module, and what semantic import versioning demands",
      ],
    }),
  ],
};
