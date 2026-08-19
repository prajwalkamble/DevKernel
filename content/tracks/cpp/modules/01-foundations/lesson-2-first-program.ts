import type { Lesson } from "@/content/types";

export const firstProgramLesson: Lesson = {
  id: "cpp-first-program",
  slug: "first-program-and-the-build",
  moduleSlug: "foundations",
  title: "Your First Program & How It Gets Built",
  summary:
    "Write, compile and run a C++ program from an empty directory, then take the build apart stage by stage — preprocessor, compiler, assembler, linker — and watch 86 bytes of source become a 16KB executable.",
  estimatedMinutes: 35,
  objectives: [
    "Install a working toolchain and confirm it",
    "Write, compile and run a program from an empty directory",
    "Explain every line of `hello.cpp`, including what `main` returning `int` means",
    "Name the four build stages and what each one consumes and produces",
    "Inspect the intermediate output of each stage yourself",
    "Understand why `#include <iostream>` costs a million characters",
  ],
  sections: [
    {
      id: "toolchain",
      heading: "Getting a compiler",
      body: [
        "You need three things: a **compiler**, a **standard library implementation**, and an **editor**. On Linux and macOS the first two arrive together; on Windows there is one extra decision.",
        "There are three mainstream compilers, and they are genuinely interchangeable for everything in this track. **GCC** (`g++`) is the default on Linux. **Clang** (`clang++`) is the default on macOS and has historically had the clearest error messages. **MSVC** (`cl.exe`) ships with Visual Studio and is the default on Windows.",
        "A habit worth forming immediately: **build with a second compiler occasionally.** They disagree about which mistakes are worth warning about, and code that compiles clean under both is meaningfully more correct. It costs one command.",
      ],
      examples: [
        {
          id: "install",
          title: "Installing, per platform",
          lang: "bash",
          code: `# Debian / Ubuntu / Parrot
$ sudo apt install build-essential gdb
$ g++ --version
g++ (Debian 14.2.0-19) 14.2.0

# Fedora
$ sudo dnf install gcc-c++ gdb

# macOS — installs clang as "g++" too
$ xcode-select --install
$ clang++ --version

# Windows
#   Option A: Visual Studio Community, "Desktop development with C++"
#   Option B: MSYS2, then:  pacman -S mingw-w64-ucrt-x86_64-gcc
#   Option C: WSL, then follow the Debian instructions above

# Check your compiler is new enough for this track. You want GCC 11+,
# Clang 14+, or MSVC 19.30+ for solid C++20 support.
$ g++ -std=c++20 --version`,
          explanation:
            "On Debian-family systems `build-essential` is the package that pulls in the compiler, the standard library headers, and `make`. Installing `g++` alone sometimes leaves you without pieces you need. `gdb` is the debugger — you do not need it today, but module 12 does, and it is one word extra now.",
        },
      ],
    },
    {
      id: "hello",
      heading: "The program, line by line",
      body: [
        "Create an empty directory, put this in a file called `hello.cpp`, and we will go through every character of it.",
      ],
      examples: [
        {
          id: "hello-world",
          title: "hello.cpp",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    std::cout << "Hello, world!\\n";
    return 0;
}`,
          output: `Hello, world!`,
          explanation:
            "Five lines, and four separate ideas worth understanding rather than copying.",
        },
        {
          id: "hello-build",
          title: "Building and running it",
          lang: "bash",
          code: `$ g++ -std=c++20 -Wall -Wextra hello.cpp -o hello
$ ./hello
Hello, world!

# On Windows with MSVC:
> cl /std:c++20 /W4 hello.cpp
> hello.exe`,
          explanation:
            "`-o hello` names the output. Leave it off and GCC produces a file called `a.out`, a default that has survived since 1970 and confuses everyone exactly once. On Windows you run `hello.exe`; on Linux and macOS the `./` prefix is required, because the current directory is deliberately not on your `PATH`.",
        },
      ],
    },
    {
      id: "line-by-line",
      heading: "What each line actually does",
      body: [
        "**`#include <iostream>`** — the `#` marks this as a *preprocessor directive*, which is handled before the compiler proper sees the file. It means, quite literally, \"paste the entire contents of the file `iostream` here\". That gives you the declarations for `std::cout` and the `<<` operator. The angle brackets say to look in the standard system include paths; quotes (`#include \"myfile.h\"`) say to look next to your own source file first.",
        "**`int main()`** — every C++ program has exactly one `main`, and execution starts there. It is not special because of its name alone; it is the agreed entry point between your program and the operating system. `int` is its return type: the value that goes back to the OS as the program's **exit status**. By universal convention `0` means success and anything else means failure — this is what makes `./build.sh && ./run.sh` work in a shell, and what CI systems check.",
        "**`std::cout << \"Hello, world!\\n\";`** — `std::cout` is the standard output stream. `std` is the namespace the entire standard library lives in, and `::` is the scope resolution operator, so `std::cout` reads as \"`cout` from `std`\". The `<<` is the *stream insertion operator*: it sends the thing on its right into the stream on its left. `\\n` inside a string literal is a newline character.",
        "**`return 0;`** — hands `0` back to the operating system. `main` is unique in that you may omit this: if control reaches the closing brace of `main` without a `return`, the compiler inserts `return 0;` for you. No other function gets that treatment. Being explicit is still common and costs nothing.",
      ],
      examples: [
        {
          id: "exit-status",
          title: "The return value is visible from the shell",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    std::cout << "running\\n";
    return 3;
}`,
          output: `running
exit code: 3`,
          explanation:
            "Compile and run it, then ask the shell with `echo $?` (or `echo %ERRORLEVEL%` on Windows). This is how a command-line tool reports failure to whatever invoked it — and why returning a meaningless value from `main` is a real bug in a program that will be scripted.",
        },
      ],
      pitfalls: [
        {
          title: "Do not write `using namespace std;` — especially not in a header",
          body: "It drags every name in the standard library into your scope, and the standard library is enormous. The classic collision is `std::count`, which will silently fight with your own `count`. In a header it is worse, because every file that includes yours inherits the problem. Type `std::` — it is five characters, and it tells a reader where a name comes from. If a particular name is genuinely noisy in one function, `using std::cout;` inside that function is the narrow, defensible version.",
        },
        {
          title: "`std::endl` is not a newline",
          body: "`std::cout << std::endl` writes a newline *and flushes the stream*. Flushing forces the operating system to commit the buffer immediately, which is a system call. In a loop printing thousands of lines, using `std::endl` instead of `'\\n'` can make output several times slower for no benefit. Use `'\\n'`, and flush deliberately with `std::flush` on the rare occasions you need to.",
        },
      ],
    },
    {
      id: "pipeline",
      heading: "The four stages of a build",
      body: [
        "`g++ hello.cpp -o hello` looks like one action. It is four programs in a row, and knowing them is what turns most build errors from mysterious into obvious — particularly the linker errors, which are the ones that confuse newcomers most because they do not mention a line of your code.",
        "**1. The preprocessor** consumes your `.cpp` and produces a single expanded translation unit. It is a text substitution engine that knows nothing about C++: it pastes in `#include` files, expands `#define` macros, and resolves `#ifdef` conditionals. Its output is still C++ source, just much bigger.",
        "**2. The compiler** consumes that expanded source and produces **assembly** — human-readable instructions for your specific processor. This is the stage that parses C++, checks types, reports the errors you spend most of your time on, and does the optimisation.",
        "**3. The assembler** consumes assembly and produces an **object file** (`.o`, or `.obj` on Windows): real machine code, but with holes. Every call to a function defined elsewhere is left as a named blank to be filled in.",
        "**4. The linker** consumes all the object files and libraries, fills in those blanks, and produces the final executable. If a name was declared but never defined anywhere, the linker is what tells you — and it tells you at the level of symbols, not source lines.",
      ],
      examples: [
        {
          id: "stages",
          title: "Stopping after each stage, and looking",
          lang: "bash",
          code: `$ g++ -std=c++20 -E hello.cpp -o hello.ii   # 1. preprocess only
$ g++ -std=c++20 -S hello.cpp -o hello.s    # 2. compile to assembly
$ g++ -std=c++20 -c hello.cpp -o hello.o    # 3. assemble to an object file
$ g++ hello.o -o hello                      # 4. link

$ ls -l hello.cpp hello.ii hello.s hello.o hello
      86  hello.cpp    <- what you wrote
 1104170  hello.ii     <- after #include <iostream> was pasted in
    1210  hello.s      <- assembly
    1768  hello.o      <- machine code with holes
   16344  hello         <- the linked executable`,
          output: `86 bytes of source became 1,104,170 characters of preprocessed code.`,
          explanation:
            "Those are real numbers from this exact file. **`#include <iostream>` expands to over a million characters** — around 43,600 lines — because it includes headers that include headers. This is not a curiosity: it is *the* reason C++ builds are slow, and it is why module 12 spends time on modules and forward declarations, both of which exist to make this number smaller.",
        },
        {
          id: "preprocessed",
          title: "The preprocessor is pure text substitution",
          lang: "cpp",
          code: `#include <iostream>
#define GREETING "hello"
int main() { std::cout << GREETING << '\\n'; }`,
          output: `# 3 "pipeline.cpp"
int main() { std::cout << "hello" << '\\n'; }`,
          explanation:
            "That is the tail of `g++ -E` on the file above — the last line of a 43,607-line result. `GREETING` is gone; the text `\"hello\"` sits where it was. The preprocessor did not check a type or understand a scope, it substituted text. That is exactly why macros are dangerous and why modern C++ prefers `const`, `constexpr` and templates for everything macros were once used for.",
        },
        {
          id: "object-symbols",
          title: "The holes in an object file",
          lang: "bash",
          code: `$ g++ -std=c++20 -c hello.cpp -o hello.o
$ nm -C hello.o
0000000000000000 T main
                 U std::ios_base_library_init()
                 U std::cout
                 U std::basic_ostream<char, std::char_traits<char> >&
                   std::operator<< <std::char_traits<char> >(
                     std::basic_ostream<char, std::char_traits<char> >&, char const*)`,
          explanation:
            "`nm` lists the symbols in an object file and `-C` demangles the compiler's internal names back into readable C++. **`T` means defined in this file** — `main` is there. **`U` means undefined** — a hole. `std::cout` and the `<<` that prints a string are promises the linker must keep by finding them in the standard library. When you see \"undefined reference to…\", this is the mechanism: a `U` that nobody could satisfy.",
        },
      ],
      pitfalls: [
        {
          title: "Compiler errors and linker errors are different problems",
          body: "A compiler error names a file and a line and complains about your syntax or types. A linker error names a *symbol* and usually no line at all, and it means \"you promised this function exists and it does not\". The usual causes are forgetting to compile one of your `.cpp` files, declaring a function in a header and never writing its body, or forgetting to link a library (`-lpthread`, `-lm`). Recognising which of the two you are looking at halves the time to fix it.",
        },
      ],
    },
    {
      id: "flags",
      heading: "The flags you should always be using",
      body: [
        "The compiler's defaults are conservative for backwards-compatibility reasons, not because they are good for you. Four additions are worth making permanent from today.",
        "**`-std=c++20`** — never rely on the default. It differs by compiler version, and a colleague with a different one will get different behaviour from identical source.",
        "**`-Wall -Wextra`** — warnings. Despite the name, `-Wall` is nowhere near all of them; `-Wextra` adds another valuable batch. These catch unused variables, signed/unsigned comparison mistakes, and functions that fall off the end without returning.",
        "**`-g`** — debug information, so a debugger can show you source lines and variable names instead of hex addresses. It makes the binary larger and does *not* make it slower.",
        "**`-O2`** for release builds — optimisation. The difference between `-O0` and `-O2` is routinely 2–10x. Do not benchmark anything at `-O0`; you will be measuring the compiler's laziness rather than your code.",
      ],
      examples: [
        {
          id: "flags-example",
          title: "A development build and a release build",
          lang: "bash",
          code: `# Development: warnings on, debug info, no optimisation, sanitizers.
$ g++ -std=c++20 -Wall -Wextra -g -O0 -fsanitize=address,undefined \\
      main.cpp -o main-debug

# Release: optimised, no debug info, no sanitizers.
$ g++ -std=c++20 -Wall -Wextra -O2 -DNDEBUG main.cpp -o main

# Warnings as errors, once a project is clean. Common in CI.
$ g++ -std=c++20 -Wall -Wextra -Werror main.cpp -o main`,
          explanation:
            "`-fsanitize=address,undefined` is worth meeting on day one even though its payoff comes in module 3. It instruments your program to catch buffer overruns, use-after-free and undefined behaviour *at the moment they happen*, with a stack trace, instead of letting them corrupt something and crash later. It costs roughly 2x runtime, which is why it lives in the debug build and not the release one. It is the single most valuable tool in C++, and most people meet it years too late.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Walk me through what happens when you compile a C++ program.",
      answer:
        "Four stages. The preprocessor performs text substitution — pasting in `#include` files, expanding macros, resolving `#ifdef` — producing one expanded translation unit. The compiler parses that, type-checks it, optimises, and emits assembly. The assembler turns assembly into an object file: machine code where every reference to something defined elsewhere is left as a named undefined symbol. The linker resolves those symbols across all object files and libraries and produces the executable. Knowing the split is what makes linker errors tractable, since they name symbols rather than source lines.",
    },
    {
      question: "What is the difference between a compiler error and a linker error?",
      answer:
        "A compiler error is about one translation unit — bad syntax, a type mismatch, an undeclared name — and it names a file and line. A linker error is about the whole program: a symbol was declared and used but never defined anywhere, or a library was not linked. It reports a mangled or demangled symbol name and usually no line number. Typical causes are forgetting to compile a source file, declaring a function without ever defining it, or omitting `-lpthread`.",
    },
    {
      question: "Why does `#include <iostream>` make compilation slow?",
      answer:
        "Because `#include` is literal text substitution, and `<iostream>` transitively pulls in a large tree of other headers. On a typical toolchain a five-line hello world expands to over a million characters — about 43,000 lines — and every translation unit that includes it pays that cost again. This is why forward declarations, the pimpl idiom, precompiled headers and C++20 modules all exist: they exist to make that number smaller.",
    },
    {
      question: "What does `main` returning `int` mean, and can you omit the return?",
      answer:
        "The `int` is the process exit status handed back to the operating system, where 0 conventionally means success and non-zero means failure — that is what shell `&&` chains and CI systems check. `main` is the one function where you may omit the return statement: if control reaches its closing brace the compiler inserts `return 0;`. Any other non-void function that falls off the end is undefined behaviour, which is one of the things `-Wall` warns about.",
    },
    {
      question: "Why is `using namespace std;` discouraged?",
      answer:
        "It imports every name from a very large namespace into the current scope, which invites collisions — `std::count`, `std::distance` and `std::size` are all plausible names for your own functions, and the resulting error can be confusing or, worse, silently pick the wrong overload. In a header it is much worse, because every file that includes it inherits the problem and cannot opt out. The narrow alternative is a `using std::cout;` declaration inside a single function.",
    },
  ],
  takeaways: [
    "Every program has exactly one `main`; its `int` return is the process exit status, 0 for success",
    "`std::cout << x` sends `x` into the standard output stream; `std` is the namespace and `::` is scope resolution",
    "Prefer `'\\n'` to `std::endl` — `endl` also flushes, which is a system call you rarely want",
    "The build is four stages: preprocess, compile, assemble, link — and each can be inspected with `-E`, `-S`, `-c`",
    "`#include` is literal text substitution: five lines of source expand to over a million characters",
    "`T` in `nm` output means defined here, `U` means an unfilled hole — an unfilled `U` is what \"undefined reference\" means",
    "Always compile with `-std=c++20 -Wall -Wextra`; add `-g` and sanitizers for development, `-O2` for release",
  ],
  status: "available",
};
