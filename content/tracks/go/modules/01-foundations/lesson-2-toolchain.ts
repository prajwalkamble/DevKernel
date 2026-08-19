import type { Lesson } from "@/content/types";

export const toolchainLesson: Lesson = {
  id: "go-toolchain",
  slug: "toolchain-and-first-program",
  moduleSlug: "foundations",
  title: "The Toolchain & Your First Program",
  summary:
    "Install Go, then meet the one command that does everything: run, build, test, format and vet. Write a program two ways — as a loose file, then as a real module — and understand what go.mod is for.",
  estimatedMinutes: 30,
  objectives: [
    "Install Go and verify the installation",
    "Run a single file with go run",
    "Create a module with go mod init and explain what go.mod records",
    "Build a standalone binary with go build",
    "Use gofmt and go vet, and know why formatting is not a matter of taste",
    "Read the layout of a small Go project",
  ],
  sections: [
    {
      id: "install",
      heading: "Installing Go",
      body: [
        "Download the installer from **go.dev/dl** and run it. On macOS `brew install go` works; on Linux, prefer the official tarball over your distribution's package, which is often several releases behind.",
        "One command tells you whether it worked.",
      ],
      examples: [
        {
          id: "go-version",
          title: "Check the installation",
          lang: "bash",
          code: `go version`,
          output: `go version go1.24.4 linux/amd64`,
          explanation:
            "Your version and platform will differ; anything from 1.21 onwards runs everything in this track. Unlike most languages, there is nothing else to install — no package manager, no build tool, no formatter, no test runner. The `go` command is all of them.",
        },
      ],
    },
    {
      id: "one-tool",
      heading: "One command, many jobs",
      body: [
        "This is the part that surprises people arriving from JavaScript or Python, where a project needs a formatter, a linter, a bundler, a test runner and a package manager, each with its own config file. Go ships all of it in the `go` command, and none of it is configurable.",
        "`go run` — compile and execute in one step, leaving no binary behind",
        "`go build` — produce a standalone executable",
        "`go test` — run tests, which live beside the code they test",
        "`go fmt` — reformat to the one canonical layout",
        "`go vet` — report suspicious constructs the compiler allows",
        "`go mod` — manage dependencies",
      ],
    },
    {
      id: "first-program",
      heading: "The loose-file way",
      body: [
        "Create `hello.go` anywhere and put this in it.",
      ],
      examples: [
        {
          id: "hello",
          title: "hello.go",
          lang: "go",
          code: `package main

import "fmt"

func main() {
	fmt.Println("Hello, world!")
}`,
          output: `Hello, world!`,
          explanation:
            "Run it with `go run hello.go`. Three things are load-bearing. `package main` marks this as a program rather than a library — any other package name produces a library that cannot be run directly. `func main()` is the entry point, and there must be exactly one. `import \"fmt\"` pulls in the formatting package; leave it in without using it and the program will not compile, which is a rule you will meet properly in a moment.",
        },
      ],
    },
    {
      id: "modules",
      heading: "The real way: a module",
      body: [
        "A loose file is fine for a scratch program. Anything with a dependency, a second file, or a test needs a **module**, which is Go's unit of versioning and distribution.",
      ],
      examples: [
        {
          id: "module-init",
          title: "Creating a module",
          lang: "bash",
          code: `mkdir hello && cd hello
go mod init example/hello`,
          output: `go: creating new go.mod: module example/hello`,
          explanation:
            "The module path — `example/hello` here — is how other code would import yours. For anything you intend to publish it should be the repository URL, such as `github.com/you/hello`, because that is literally where Go will fetch it from. For a local experiment any name works.",
        },
        {
          id: "go-mod",
          title: "go.mod",
          lang: "properties",
          code: `module example/hello

go 1.24.4`,
          explanation:
            "Two lines to start: what this module is called, and the minimum Go version it needs. Dependencies get added here automatically as you import them, alongside a `go.sum` file recording their checksums. There is no separate lockfile — `go.mod` and `go.sum` together are the lockfile.",
        },
        {
          id: "run-and-build",
          title: "Running, then building",
          lang: "bash",
          code: `# Compile and run in one step
go run .

# Or produce a real binary
go build -o hello .
./hello`,
          output: `Hello, world!
Hello, world!`,
          explanation:
            "Note the `.` — inside a module you build the *package in this directory*, not a named file. `go build` leaves behind a single self-contained executable with no external dependencies: you can copy it to another machine of the same platform and it will run, with no Go installation required. That property is most of why Go took over infrastructure tooling.",
        },
      ],
    },
    {
      id: "fmt-and-vet",
      heading: "gofmt settles the argument",
      body: [
        "Go has exactly one legal formatting style, and a tool that produces it. Tabs for indentation, braces on the same line, a specific spacing for everything. You do not configure it, because there is nothing to configure.",
        "This sounds authoritarian and turns out to be a relief. Nobody reviews formatting in a Go pull request, because there is nothing to review — every editor runs `gofmt` on save, and every Go file in the world looks the same.",
      ],
      examples: [
        {
          id: "fmt-vet",
          title: "Formatting and vetting",
          lang: "bash",
          code: `# Reformat every file in place
go fmt ./...

# List files that are not formatted, without changing them
gofmt -l .

# Report suspicious-but-legal code
go vet ./...`,
          explanation:
            "`gofmt -l .` printing nothing means everything is already formatted — that is the form to use in continuous integration. `go vet` is a step beyond the compiler: it catches things that compile but are almost certainly mistakes, such as a `Printf` whose verbs do not match its arguments.",
        },
      ],
      pitfalls: [
        {
          title: "Tabs, not spaces — and it is not up for debate",
          body: "`gofmt` indents with tabs. If your editor is set to convert tabs to spaces, every file you touch will show up as entirely rewritten in the diff. Configure your editor to leave Go files alone and let `gofmt` handle them.",
        },
      ],
    },
  ],
  takeaways: [
    "The `go` command is the compiler, formatter, linter, test runner and package manager",
    "`go run` for scratch work, `go build` for a standalone binary",
    "`go mod init` creates a module; go.mod plus go.sum is the lockfile",
    "The module path should be the repository URL for anything you publish",
    "gofmt has no options, which is the point",
  ],
  status: "available",
};
