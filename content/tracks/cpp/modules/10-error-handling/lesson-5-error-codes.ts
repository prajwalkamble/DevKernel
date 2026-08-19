import type { Lesson } from "@/content/types";

export const errorCodesLesson: Lesson = {
  id: "cpp-error-codes",
  slug: "error-codes-and-std-error-code",
  moduleSlug: "error-handling",
  title: "Error Codes, std::error_code & When Exceptions Are the Wrong Tool",
  summary:
    "The other error model, and how to choose deliberately between them. What exceptions genuinely cost, why parts of the standard library offer both forms of every function, and how to plug your own error enum into `std::error_code` so it composes with everything else.",
  estimatedMinutes: 35,
  objectives: [
    "State what exceptions cost and where that cost falls",
    "Choose between exceptions and error codes on the nature of the failure",
    "Use `std::error_code` and distinguish it from `std::error_condition`",
    "Register a custom error enum with the `error_code` machinery",
    "Recognise the standard library's dual-API pattern",
  ],
  sections: [
    {
      id: "the-cost",
      heading: "What exceptions actually cost",
      body: [
        "The debate is usually conducted with more heat than measurement, so it is worth stating precisely what the costs are.",
        "**On the success path, essentially nothing.** Modern implementations use *zero-cost* — more accurately, table-driven — exception handling: no code runs to enter or leave a `try` block, and the unwinding information lives in a separate table consulted only when something throws. A function that never throws runs at the same speed with or without exception support.",
        "**On the throwing path, a great deal.** A throw allocates the exception object, consults unwinding tables, walks frames, and runs destructors — typically **microseconds**, thousands of times more expensive than returning an error code. Exceptions are for exceptional cases, and using one for a condition that occurs on a quarter of calls is a genuine performance bug.",
        "**In binary size, measurably.** The unwinding tables and cleanup code are real, often 5–15% of a binary. This is why embedded and some game projects build with `-fno-exceptions`.",
        "**In predictability, significantly.** Throw duration is not bounded in any useful way, which rules exceptions out for hard real-time paths.",
        "**And in reasoning cost, most of all.** Any call that is not `noexcept` may throw, so any line may be an exit point. That is what makes RAII non-optional rather than merely good style.",
      ],
      examples: [
        {
          id: "dual-api",
          title: "The standard library offering both forms",
          lang: "cpp",
          code: `#include <cerrno>
#include <filesystem>
#include <iostream>
#include <system_error>

int main() {
    // A standard errno-based code.
    std::error_code sys{ENOENT, std::generic_category()};
    std::cout << "system code : " << sys.value()
              << " [" << sys.category().name() << "] "
              << sys.message() << '\\n';

    // error_code converts to bool: false means success.
    std::error_code none;
    std::cout << "\\nempty code is " << (none ? "an error" : "success") << '\\n';

    // The dual API: most <filesystem> functions have both forms.
    std::error_code ec;
    auto size = std::filesystem::file_size("/definitely/not/here", ec);
    std::cout << "\\nfile_size with error_code: ";
    if (ec) std::cout << "failed -- " << ec.message() << '\\n';
    else    std::cout << size << '\\n';

    try {
        (void)std::filesystem::file_size("/definitely/not/here");
    } catch (const std::filesystem::filesystem_error& e) {
        std::cout << "file_size throwing form  : " << e.code().message() << '\\n';
    }

    // Compare against a PORTABLE condition, not a raw platform value.
    if (ec == std::errc::no_such_file_or_directory)
        std::cout << "\\nmatched std::errc::no_such_file_or_directory portably\\n";
}`,
          output: `system code : 2 [generic] No such file or directory

empty code is success

file_size with error_code: failed -- No such file or directory
file_size throwing form  : No such file or directory

matched std::errc::no_such_file_or_directory portably`,
          explanation:
            "**Every `<filesystem>` operation comes in two forms**, distinguished only by whether you pass an `std::error_code&`. That is the library acknowledging that a missing file is sometimes exceptional and sometimes entirely expected, and refusing to decide for you. Note the last comparison: `ec == std::errc::no_such_file_or_directory` works across platforms because `errc` values are *conditions* that categories map onto, where comparing `ec.value() == 2` would be hard-coding a Linux errno.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing between them",
      body: [
        "The useful question is not \"which is better\" but **\"is this failure exceptional?\"** — meaning: is it rare, and is the immediate caller usually unable to do anything about it?",
        "**Use exceptions when** the failure is genuinely rare; when most callers cannot handle it and want it propagated to a boundary; when the error must cross many frames, since exceptions skip the intermediate ones automatically; and — importantly — **in constructors**, which have no return value and so have no other way to report failure. Also for anything a caller forgetting to check would be catastrophic, since an exception cannot be silently ignored.",
        "**Use error codes when** the failure is expected as part of normal operation — a file that may not exist, input that may not parse, a lookup that may miss; when the immediate caller will handle it right there; on a hot path where the throw cost matters; when crossing an ABI or a C boundary, since exceptions do not propagate through C code; and in a codebase built with `-fno-exceptions`.",
        "**The clearest single heuristic**: if the caller will almost always write `try`/`catch` immediately around the call, an error code expresses it better. If the caller almost never wants to handle it locally, an exception does.",
        "**Do not mix models arbitrarily within one API.** A library where some functions throw and others return codes, with no discernible rule, is harder to use than either convention applied consistently. The `<filesystem>` pattern — both forms for every function, chosen by an overload — is the principled way to offer a choice.",
      ],
      examples: [
        {
          id: "custom-category",
          title: "Plugging your own error enum into `std::error_code`",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <system_error>

// A domain-specific error enum, plugged into std::error_code.
enum class ParseError { ok = 0, unexpectedEof = 1, badDigit = 2, tooLong = 3 };

class ParseErrorCategory : public std::error_category {
public:
    const char* name() const noexcept override { return "parse"; }
    std::string message(int ev) const override {
        switch (static_cast<ParseError>(ev)) {
            case ParseError::ok:            return "ok";
            case ParseError::unexpectedEof: return "unexpected end of input";
            case ParseError::badDigit:      return "invalid digit";
            case ParseError::tooLong:       return "input too long";
        }
        return "unknown parse error";
    }
};

const ParseErrorCategory& parseCategory() {
    static ParseErrorCategory c;
    return c;
}

std::error_code make_error_code(ParseError e) {
    return {static_cast<int>(e), parseCategory()};
}

// This opt-in is what lets ParseError convert implicitly to error_code.
namespace std {
    template <> struct is_error_code_enum<ParseError> : true_type {};
}

int main() {
    std::error_code parse = ParseError::badDigit;   // implicit conversion
    std::cout << "parse code  : " << parse.value()
              << " [" << parse.category().name() << "] "
              << parse.message() << '\\n';

    std::cout << "parse code is " << (parse ? "an error" : "success") << '\\n';

    // The point: one type carries errors from any subsystem, and callers
    // that only pass it along need know nothing about the categories.
    std::error_code sys{2, std::generic_category()};
    for (std::error_code ec : {parse, sys}) {
        std::cout << "  [" << ec.category().name() << "] " << ec.message() << '\\n';
    }
}`,
          output: `parse code  : 2 [parse] invalid digit
parse code is an error
  [parse] invalid digit
  [generic] No such file or directory`,
          explanation:
            "**Both codes have value 2 and mean completely different things**, and the category keeps them apart — that is the whole design. A caller that merely logs or propagates an error needs to know nothing about which subsystem produced it, while a caller that wants to handle a specific case can compare against the right enum. The `is_error_code_enum` specialisation is the opt-in that makes `std::error_code ec = ParseError::badDigit;` compile without a cast.",
        },
      ],
      pitfalls: [
        {
          title: "`error_code` and `error_condition` are not the same thing",
          body: "`std::error_code` holds a *specific, platform-dependent* error from a specific category — Linux errno 2, a Windows `GetLastError` value, your parser's code 2. `std::error_condition` is a *portable abstraction* you compare against, which is what `std::errc` values produce. Comparing an `error_code` to an `error_condition` asks the category whether they correspond, which is why `ec == std::errc::no_such_file_or_directory` works on every platform while `ec.value() == 2` works only where that number happens to mean that. Return `error_code`; compare against `error_condition`.",
        },
      ],
    },
    {
      id: "the-out-parameter-problem",
      heading: "The problem with error codes, and what replaced them",
      body: [
        "Error codes have two genuine weaknesses, and both are worth naming because they explain why `std::expected` was added.",
        "**They are ignorable.** `doThing();` compiles cleanly whether or not you look at the result, and the failure disappears silently. `[[nodiscard]]` mitigates this — a discarded return is then a warning — and it is worth putting on any function returning a status.",
        "**They force awkward signatures.** A function returning both a value and a status must return one and take the other as an out-parameter, which means the value must be default-constructible, must be declared before the call, and cannot be `const`. `std::filesystem::file_size(path, ec)` shows the shape: the return value is meaningless when `ec` is set, and nothing enforces checking.",
        "**`std::expected<T, E>` fixes both.** It returns *either* a value or an error in one object, is `[[nodiscard]]` by nature, and cannot yield the value without you handling the alternative. That is the next lesson.",
        "The historical sequence is worth seeing as a whole: **error codes → exceptions → `optional` for absence → `expected` for typed failure.** Each addressed a specific weakness in the last, and all four are still appropriate somewhere.",
      ],
      examples: [
        {
          id: "nodiscard",
          title: "Making an ignored error code a warning",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <system_error>

enum class DbError { ok = 0, timeout, conflict };

// Without [[nodiscard]] this can be ignored silently.
DbError writeUnchecked(const std::string&) { return DbError::timeout; }

// With it, discarding the result is a warning.
[[nodiscard]] DbError writeChecked(const std::string&) { return DbError::timeout; }

// The out-parameter shape error codes force on you.
bool readValue(const std::string& key, int& out, std::error_code& ec) {
    if (key != "answer") { ec = std::make_error_code(std::errc::invalid_argument);
                           return false; }
    out = 42;
    ec.clear();
    return true;
}

int main() {
    writeUnchecked("row");          // compiles silently -- the failure vanishes

    if (auto e = writeChecked("row"); e != DbError::ok)
        std::cout << "writeChecked reported an error\\n";

    // The out-parameter dance: 'value' must exist first and cannot be const.
    int value = 0;
    std::error_code ec;
    if (readValue("answer", value, ec)) std::cout << "read " << value << '\\n';
    if (!readValue("other", value, ec))
        std::cout << "second read failed: " << ec.message() << '\\n';

    std::cout << "\\nnote 'value' is still " << value
              << " after the failed call -- stale, and nothing says so.\\n";
}`,
          output: `$ g++ -std=c++20 -Wall -Wextra nodiscard.cpp
warning: ignoring return value of 'DbError writeChecked(const std::string&)',
declared with attribute 'nodiscard' [-Wunused-result]
    -- (only if writeChecked's result is discarded)

$ ./a.out
writeChecked reported an error
read 42
second read failed: Invalid argument

note 'value' is still 42 after the failed call -- stale, and nothing says so.`,
          explanation:
            "**The last line is the out-parameter problem in one sentence.** After the failed `readValue`, `value` still holds 42 from the previous successful call — a stale value that looks entirely legitimate, and which any caller who forgot to check the return would happily use. `std::expected` makes that unrepresentable, because there is no separate variable to leave stale. `[[nodiscard]]` is the best defence available before then, and belongs on every status-returning function you write.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What do exceptions actually cost?",
      answer:
        "On the success path, essentially nothing — modern implementations are table-driven, so no code runs to enter or leave a `try` block and the unwinding data sits in a separate table consulted only when a throw happens. On the throwing path, a great deal: allocating the exception, consulting tables, walking frames and running destructors typically takes microseconds, thousands of times the cost of returning an error code. They also add 5–15% to binary size for the unwinding tables, and the throw duration is unbounded, which rules them out for hard real-time. The largest cost is arguably to reasoning: any non-`noexcept` call may throw, so any line may be an exit point.",
    },
    {
      question: "How do you decide between exceptions and error codes?",
      answer:
        "Ask whether the failure is exceptional — rare, and something the immediate caller usually cannot handle. Use exceptions for rare failures that should propagate to a boundary, for errors crossing many frames since intermediate ones are skipped automatically, in constructors which have no other way to report failure, and where silently ignoring the error would be catastrophic. Use error codes when failure is an expected part of normal operation, when the immediate caller will handle it right there, on hot paths, across ABI or C boundaries where exceptions cannot propagate, and in `-fno-exceptions` codebases. The heuristic: if callers would immediately wrap the call in `try`/`catch`, an error code says it better.",
    },
    {
      question: "What is the difference between `std::error_code` and `std::error_condition`?",
      answer:
        "`error_code` holds a specific, platform-dependent value from a specific category — a Linux errno, a Windows error number, your own subsystem's code. `error_condition` is a portable abstraction to compare against, which is what the `std::errc` enumerators produce. Comparing the two asks the category whether the specific code corresponds to the portable condition, which is why `ec == std::errc::no_such_file_or_directory` works everywhere while `ec.value() == 2` only works where that number happens to mean that. The rule is: return `error_code`, compare against `error_condition`.",
    },
    {
      question: "How do you make your own error enum work with `std::error_code`?",
      answer:
        "Three pieces. Derive a category class from `std::error_category` overriding `name()` and `message(int)`, and expose a single instance through a function returning a reference to a function-local static. Provide `std::error_code make_error_code(YourEnum)` in the enum's namespace, so ADL finds it. And specialise `std::is_error_code_enum<YourEnum>` as `true_type`, which is the opt-in that allows implicit conversion so `std::error_code ec = YourEnum::something;` compiles. After that your errors travel in the same type as everyone else's, and code that only logs or propagates needs to know nothing about the category.",
    },
    {
      question: "What are the weaknesses of the error-code model?",
      answer:
        "They are ignorable — calling a function and discarding its status compiles cleanly and the failure vanishes, which `[[nodiscard]]` mitigates by turning it into a warning. And they force awkward signatures: a function returning both a value and a status must return one and take the other as an out-parameter, so the value must be default-constructible, declared before the call, and non-`const` — and it is left holding a stale value when the call fails, with nothing indicating that. `std::expected<T, E>` addresses both by returning either a value or an error as one object that cannot yield the value without handling the alternative.",
    },
  ],
  takeaways: [
    "Modern exception handling is table-driven: no cost on the success path",
    "A throw costs microseconds — thousands of times an error-code return",
    "Unwinding tables add roughly 5–15% to binary size",
    "Use exceptions for rare failures, errors crossing many frames, and constructors",
    "Use error codes for expected failures, hot paths, ABI and C boundaries",
    "If callers would immediately `try`/`catch` around it, an error code fits better",
    "`<filesystem>` offers both forms of every function, chosen by an overload",
    "`error_code` is specific and platform-dependent; `error_condition` is the portable abstraction",
    "Compare with `std::errc` values, never with raw numeric codes",
    "Register a custom enum with a category, `make_error_code`, and `is_error_code_enum`",
    "Error codes are ignorable — put `[[nodiscard]]` on every status-returning function",
    "Out-parameters leave stale values on failure, which is what `std::expected` fixes",
  ],
  status: "available",
};
