import type { Lesson } from "@/content/types";

export const inputOutputLesson: Lesson = {
  id: "cpp-input-output",
  slug: "input-output-and-format",
  moduleSlug: "foundations",
  title: "Input, Output & std::format",
  summary:
    "Getting data in and out of a program: the stream operators and their sharp edges, why `>>` silently accepts `12x`, a reusable input-validation loop, and `std::format` — the C++20 feature that finally made formatting readable.",
  estimatedMinutes: 30,
  objectives: [
    "Read and write with `std::cin` and `std::cout`, and know when each fails",
    "Handle invalid input without an infinite loop",
    "Explain the `>>` then `std::getline` trap and fix it",
    "Format output with `std::format` instead of stream manipulators",
    "Use `std::cerr` for errors and understand why it matters",
  ],
  sections: [
    {
      id: "streams",
      heading: "The four standard streams",
      body: [
        "C++ gives you four global stream objects, declared in `<iostream>`.",
        "**`std::cout`** — standard output. Buffered, which means what you write is held and flushed in batches for speed.",
        "**`std::cin`** — standard input.",
        "**`std::cerr`** — standard error, **unbuffered**. Output appears immediately, which is exactly what you want for a message reporting a crash you are about to have.",
        "**`std::clog`** — also standard error, but buffered. Intended for logging where throughput matters more than immediacy.",
        "The distinction between `cout` and `cerr` is not cosmetic. They are separate operating-system streams, so a user can redirect one without the other — `./tool > results.txt` captures output while errors still appear on the terminal. **Write diagnostics to `cerr`.** A program that writes errors to `cout` corrupts its own output when piped into another program.",
        "`<<` is the *insertion* operator and `>>` the *extraction* operator. Both return the stream itself, which is what makes chaining work: `std::cout << a << b` is `(std::cout << a) << b`.",
      ],
    },
    {
      id: "reading",
      heading: "Reading input, and how it fails",
      body: [
        "`std::cin >> value` skips leading whitespace, reads as many characters as fit the target type, and stops at the first one that does not. That last part is the source of most surprises.",
        "If it cannot read anything valid at all, the stream enters a **failed state**. In that state it stops doing anything until you clear it, and the bad characters *stay in the buffer* — which is why the naive retry loop spins forever, reading the same garbage over and over.",
        "A stream converts to `bool`, so `if (std::cin >> value)` tests whether the read succeeded. That is the idiomatic check.",
      ],
      examples: [
        {
          id: "basic-input",
          title: "Reading a line and a number",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

int main() {
    std::cout << "Name: ";
    std::string name;
    std::getline(std::cin, name);   // reads to the newline, spaces included

    std::cout << "Age: ";
    int age{};
    std::cin >> age;                // stops at the first non-digit

    if (!std::cin) {
        std::cout << "\\nThat was not a number.\\n";
        return 1;
    }
    std::cout << "Hello " << name << ", next year you are " << age + 1 << ".\\n";
}`,
          output: `$ printf 'Ada Lovelace\\n36\\n' | ./io
Name: Age: Hello Ada Lovelace, next year you are 37.

$ printf 'Ada\\nthirty\\n' | ./io
Name: Age:
That was not a number.`,
          explanation:
            "Use `std::getline` for text — `std::cin >> name` would stop at the first space and give you just \"Ada\". The prompts appear run together because standard output is buffered and nothing forced a flush; in an interactive terminal the stream is flushed when input is requested, so it looks correct there.",
        },
      ],
      pitfalls: [
        {
          title: "`>>` accepts a valid prefix — `12x` reads as 12",
          body: "Extraction reads as much as it can and stops. Given `12x` it happily produces `12` and leaves `x` in the buffer, with the stream in a perfectly good state. So checking `if (std::cin >> value)` proves the input *started* with a number, not that it *was* a number. If you need strict validation, read a whole line with `std::getline` and parse it with `std::from_chars`, which reports how much of the string it consumed.",
        },
      ],
    },
    {
      id: "validation",
      heading: "An input loop that actually works",
      body: [
        "Recovering from bad input takes two steps, and skipping either one is what causes the infinite loop everybody writes once.",
        "**`std::cin.clear()`** resets the error flags so the stream will work again. On its own it does nothing about the offending characters.",
        "**`std::cin.ignore(n, '\\n')`** discards characters up to and including the next newline. Pass `std::numeric_limits<std::streamsize>::max()` as `n` to mean \"however many it takes\" — that specific value is treated as unlimited rather than as a count.",
        "Do both, in that order, and the loop terminates.",
      ],
      examples: [
        {
          id: "input-loop",
          title: "A reusable validated read",
          lang: "cpp",
          code: `#include <iostream>
#include <limits>
#include <string>

int read_int(const std::string& prompt) {
    int value{};
    while (true) {
        std::cout << prompt;
        if (std::cin >> value) {
            // Discard the rest of the line, including the newline.
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n');
            return value;
        }
        std::cin.clear();   // reset the fail bit
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n');
        std::cout << "  not a number, try again\\n";
    }
}

int main() {
    int age = read_int("Age: ");
    std::cout << "You are " << age << '\\n';
}`,
          output: `$ printf 'abc\\n12x\\n41\\n' | ./validate
Age:   not a number, try again
Age: You are 12`,
          explanation:
            "Read that output carefully, because it demonstrates the previous pitfall exactly. `abc` failed and was rejected. **`12x` succeeded, returning 12** — the `41` on the next line was never even read. The function does what it says (it returns an `int` the user typed), but if you needed *strict* validation this is not it. Knowing which of the two you have built is the point.",
        },
      ],
      pitfalls: [
        {
          title: "Mixing `>>` and `std::getline` gives you an empty string",
          body: "`std::cin >> age` reads the digits and **leaves the newline in the buffer**. The next `std::getline` finds that newline immediately, concludes the line is over, and hands you an empty string without waiting. The fix is `std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n')` after the `>>`, which is exactly what the loop above does before returning.",
        },
      ],
    },
    {
      id: "getline-trap",
      heading: "The getline trap, watched happening",
      body: [
        "This is worth seeing because the symptom — a prompt that does not wait for input — looks like a bug in the terminal rather than in the code.",
      ],
      examples: [
        {
          id: "getline-trap-demo",
          title: "The prompt that never waits",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

int main() {
    int age{};
    std::cout << "Age: ";
    std::cin >> age;                 // leaves the newline in the buffer

    std::cout << "Name: ";
    std::string name;
    std::getline(std::cin, name);    // reads that leftover newline: empty!

    std::cout << "[" << age << "] [" << name << "]\\n";
}`,
          output: `$ printf '36\\nAda Lovelace\\n' | ./trap
Age: Name: [36] []`,
          explanation:
            "The name is empty and \"Ada Lovelace\" was never read. Interactively this looks even stranger: the `Name:` prompt appears and the program exits instantly. **The rule to remember: after any `>>`, if the next read is a `getline`, clear the line first.**",
        },
      ],
    },
    {
      id: "format",
      heading: "std::format: the modern way to build strings",
      body: [
        "Streams are fine for simple output and become miserable the moment you want control over the presentation. Setting precision, padding a column or printing hexadecimal all require *manipulators* that are verbose, easy to get wrong, and — worst of all — **sticky**: `std::cout << std::setprecision(3)` changes every subsequent output on that stream, including in functions you did not write.",
        "**C++20 added `std::format`**, which is essentially Python's f-string formatting as a library function. It builds a `std::string`, so you can log it, return it, or print it.",
        "The syntax is a template string with `{}` placeholders. A format specification goes after a colon: `{:.3f}` for three decimal places, `{:>8}` to right-align in eight columns, `{:x}` for hexadecimal, `{:04}` for zero-padding. Positional indices — `{0}`, `{1}` — let you reorder or repeat arguments, which is what makes translated strings possible.",
        "Crucially, **it is type-safe and checked at compile time.** A mismatch between the format string and the arguments is a build error, not the memory corruption that `printf` gives you.",
      ],
      examples: [
        {
          id: "format-basics",
          title: "std::format, with the specifications you will actually use",
          lang: "cpp",
          code: `#include <format>
#include <iostream>
#include <string>

int main() {
    std::string name = "Ada";
    int age = 36;
    double ratio = 2.0 / 3.0;

    std::cout << std::format("{} is {} years old\\n", name, age);
    std::cout << std::format("ratio: {:.3f}\\n", ratio);
    std::cout << std::format("{1} then {0}\\n", "second", "first");
    std::cout << std::format("[{:>8}] [{:<8}] [{:^8}]\\n", "right", "left", "mid");
    std::cout << std::format("hex {:x}  binary {:b}  padded {:04}\\n", 255, 5, 42);
}`,
          output: `Ada is 36 years old
ratio: 0.667
first then second
[   right] [left    ] [  mid   ]
hex ff  binary 101  padded 0042`,
          explanation:
            "`>` `<` `^` are right, left and centre alignment, and the number after them is the field width — that is how you produce aligned columns without counting spaces. Compare the second line to the stream equivalent, `std::cout << std::fixed << std::setprecision(3) << ratio`, which needs two headers, two manipulators, and permanently changes the stream's state.",
        },
        {
          id: "print",
          title: "std::print, if you have C++23",
          lang: "cpp",
          code: `#include <print>

int main() {
    std::println("{} + {} = {}", 2, 3, 2 + 3);
    std::print("no newline");
    std::println("");
}`,
          output: `2 + 3 = 5
no newline`,
          explanation:
            "C++23 adds `std::print` and `std::println`, which format and write in one step without `<iostream>` involved at all — and they are faster than the equivalent `std::cout << std::format(...)` because there is no intermediate string. Requires GCC 14+ or Clang 18+. If your compiler is older, `std::cout << std::format(...)` is the C++20 spelling and behaves identically.",
        },
      ],
      pitfalls: [
        {
          title: "Stream manipulators are sticky; `std::format` is not",
          body: "`std::cout << std::hex << 255` prints `ff` — and so does the next integer you print, and the one after that, until something sets `std::dec` again. The same applies to `setprecision` and `setw`'s cousins. This causes genuinely confusing bugs when a logging function changes the stream state and a caller's output silently changes format. `std::format` has no state at all: each call is independent.",
        },
      ],
    },
    {
      id: "cerr",
      heading: "Errors go to cerr",
      body: [
        "One short section, because the habit matters more than the material.",
        "A command-line program's standard output is its *result* — the thing a user pipes into another program. Its standard error is its *commentary*. Mixing them means `./tool | grep something` sees your error messages as data.",
        "`std::cerr` is unbuffered, so its output is not lost if the program crashes immediately afterwards. That property alone makes it the right place for anything reporting a serious problem.",
      ],
      examples: [
        {
          id: "cerr-example",
          title: "Separating results from diagnostics",
          lang: "cpp",
          code: `#include <format>
#include <iostream>

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << std::format("usage: {} <filename>\\n", argv[0]);
        return 1;
    }
    std::cout << std::format("processing {}\\n", argv[1]);
    return 0;
}`,
          output: `$ ./tool
usage: ./tool <filename>

$ ./tool data.csv > out.txt      # result captured, errors still visible
$ ./tool > out.txt               # the usage message still reaches the terminal
usage: ./tool <filename>`,
          explanation:
            "`main` may also be declared as `int main(int argc, char* argv[])` to receive command-line arguments. `argc` is the count and `argv` the values, with `argv[0]` conventionally the program's own name — which is why the usage message above prints `./tool` rather than a hard-coded string. Note the non-zero return: a shell `&&` chain will stop, and CI will report failure.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between `std::cout` and `std::cerr`?",
      answer:
        "They are separate output streams. `std::cout` is buffered and carries the program's actual results; `std::cerr` is unbuffered and carries diagnostics. Because they are separate at the operating-system level, a user can redirect one without the other, so `./tool > out.txt` captures results while errors still reach the terminal. Being unbuffered also means a message written to `cerr` appears even if the program crashes immediately afterwards. Writing errors to `cout` corrupts a program's output when it is piped.",
    },
    {
      question: "Why does reading a number with `>>` and then calling `std::getline` give an empty string?",
      answer:
        "`>>` reads the digits and stops, leaving the newline in the input buffer. `std::getline` then sees that newline immediately, concludes the line has ended, and returns an empty string without waiting for input. The fix is to discard the rest of the line after the extraction: `std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n')`.",
    },
    {
      question: "How do you recover a stream from a failed read?",
      answer:
        "Two steps, and omitting either causes an infinite loop. `std::cin.clear()` resets the error flags so the stream will operate again, and `std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n')` discards the offending characters, which are still sitting in the buffer. Without the clear, nothing further is read; without the ignore, the same bad input is re-read forever.",
    },
    {
      question: "Why prefer `std::format` over stream manipulators?",
      answer:
        "Manipulators are sticky — `std::setprecision` or `std::hex` change the stream's state for everything printed afterwards, including from other functions, which causes genuinely confusing bugs. `std::format` is stateless, so each call is independent. It is also more readable, since the layout is visible in one template string rather than interleaved with the values, and it is type-safe and checked at compile time, unlike `printf`, where a mismatched specifier is undefined behaviour.",
    },
    {
      question: "If `std::cin >> n` succeeds, does that mean the user typed a valid number?",
      answer:
        "No. Extraction reads a valid prefix and stops, so `12x` yields 12 and leaves `x` in the buffer with the stream in a good state. It proves the input *began* with a number. For strict validation, read the whole line with `std::getline` and parse it with `std::from_chars`, which reports a pointer to where it stopped so you can confirm the entire string was consumed.",
    },
  ],
  takeaways: [
    "Four streams: `cout` (buffered results), `cerr` (unbuffered diagnostics), `clog`, `cin`",
    "Put diagnostics on `cerr` so piping and redirection keep working, and so messages survive a crash",
    "`>>` reads a valid prefix and stops — `12x` gives you 12 with no error",
    "Recover from a failed read with `clear()` then `ignore(max, '\\n')`, in that order",
    "After a `>>`, discard the rest of the line before any `std::getline`, or you get an empty string",
    "`std::format` is type-safe, compile-time checked and stateless; stream manipulators are sticky",
    "`{:.3f}` precision, `{:>8}` alignment, `{:x}` hex, `{:04}` zero-pad, `{0}` positional",
    "C++23's `std::print`/`std::println` format and write in one step, with no intermediate string",
  ],
  status: "available",
};
