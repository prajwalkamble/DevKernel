import type { Lesson } from "@/content/types";

export const stringViewLesson: Lesson = {
  id: "cpp-string-view",
  slug: "string-and-string-view",
  moduleSlug: "standard-library",
  title: "std::string & string_view — Avoiding Needless Copies",
  summary:
    "The small-string optimisation, and the non-owning view that turns a hundred allocations into zero. Where `string_view` belongs, the two ways it will bite you — dangling and the missing null terminator — and how to tell which one you are holding.",
  estimatedMinutes: 35,
  objectives: [
    "Explain the small-string optimisation and what it costs",
    "Use `string_view` for parameters that only read",
    "Measure the allocations a `const std::string&` parameter causes",
    "Recognise a dangling `string_view` and the lifetimes that create one",
    "Say why `string_view` must not be passed to a C API",
  ],
  sections: [
    {
      id: "sso",
      heading: "The small-string optimisation",
      body: [
        "`std::string` owns a heap buffer — except when it does not. **Every mainstream implementation stores short strings inside the string object itself**, in a small inline buffer, and only allocates when the text outgrows it. That is the small-string optimisation, and it is why `sizeof(std::string)` is 32 on libstdc++ rather than the 8 or 16 a pointer-and-size would need.",
        "The threshold is 15 characters on libstdc++ and 22 on libc++, both excluding the terminator. Below it, constructing a string allocates nothing at all.",
        "**This matters for how much you should worry.** A `std::string` parameter holding `\"GET\"` costs a copy of 32 bytes and no allocation. The same parameter holding a URL allocates every call. So \"avoid string copies\" is good advice that applies unevenly, and the examples in this lesson deliberately use long strings so the cost is visible.",
        "**`std::string_view` is a pointer and a length** — 16 bytes, no ownership, no allocation, ever. It refers to characters someone else owns. Constructing one is two stores, and copying one is two loads.",
      ],
      examples: [
        {
          id: "allocations",
          title: "Counting what each parameter type costs",
          lang: "cpp",
          code: `#include <cstdlib>
#include <iostream>
#include <string>
#include <string_view>

static int allocations = 0;
void* operator new(std::size_t n) { ++allocations; return std::malloc(n); }
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

// Takes a std::string by const& -- but a literal must still BUILD one.
bool startsWithStr(const std::string& s, const std::string& prefix) {
    return s.rfind(prefix, 0) == 0;
}

// Takes a string_view -- no allocation, no copy, works for anything.
bool startsWithView(std::string_view s, std::string_view prefix) {
    return s.starts_with(prefix);
}

int main() {
    std::cout << "sizeof(std::string)      = " << sizeof(std::string) << '\\n';
    std::cout << "sizeof(std::string_view) = " << sizeof(std::string_view) << '\\n';

    allocations = 0;
    std::string small = "short";
    std::cout << "short string allocations: " << allocations << "  (SSO)\\n";

    allocations = 0;
    std::string big = "this string is definitely longer than the SSO buffer";
    std::cout << "long  string allocations: " << allocations << '\\n';

    const std::string text = "the quick brown fox jumps over the lazy dog";

    allocations = 0;
    for (int i = 0; i < 100; ++i)
        (void)startsWithStr(text, "the quick brown fox jumps");
    std::cout << "\\n100 calls taking const std::string& : "
              << allocations << " allocations\\n";

    allocations = 0;
    for (int i = 0; i < 100; ++i)
        (void)startsWithView(text, "the quick brown fox jumps");
    std::cout << "100 calls taking string_view        : "
              << allocations << " allocations\\n";

    // Substrings: substr COPIES, a view does not.
    allocations = 0;
    for (int i = 0; i < 100; ++i) (void)text.substr(4, 30);
    std::cout << "\\n100 x text.substr(4,30)             : "
              << allocations << " allocations\\n";

    allocations = 0;
    std::string_view sv{text};
    for (int i = 0; i < 100; ++i) (void)sv.substr(4, 30);
    std::cout << "100 x string_view::substr(4,30)     : "
              << allocations << " allocations\\n";
}`,
          output: `sizeof(std::string)      = 32
sizeof(std::string_view) = 16
short string allocations: 0  (SSO)
long  string allocations: 1

100 calls taking const std::string& : 100 allocations
100 calls taking string_view        : 0 allocations

100 x text.substr(4,30)             : 100 allocations
100 x string_view::substr(4,30)     : 0 allocations`,
          explanation:
            "**`const std::string&` is not a free parameter type.** It avoids copying an existing `std::string`, but a caller passing a literal — which is overwhelmingly common — must construct a temporary `std::string` first, and that allocates. A hundred calls, a hundred allocations, for a function that only reads. `string_view` took zero. The bottom pair is the same point for substrings: `std::string::substr` returns a new owning string and allocates; `string_view::substr` just adjusts a pointer and a length.",
        },
      ],
    },
    {
      id: "where-to-use",
      heading: "Where each one belongs",
      body: [
        "**Take `std::string_view` for a parameter the function only reads and does not store.** It accepts `std::string`, string literals, `const char*`, character buffers and other views, all without conversion, and it is the single highest-value application of the type.",
        "**Take `const std::string&` when the function needs an actual `std::string`** — because it calls `c_str()`, or passes it to something that requires one.",
        "**Take `std::string` by value when the function will store a copy.** Combined with `std::move` into the member, that is one move for an rvalue caller and one copy for an lvalue caller, which is optimal for both. Taking `const std::string&` and copying into the member always copies.",
        "**Return `std::string`, not `string_view`**, unless you are returning a view of something the caller demonstrably owns and outlives the call. Returning a view of a local or a parameter is a dangling reference.",
        "**Do not store a `string_view` in a long-lived data structure** unless you have a hard guarantee about the referent's lifetime. Members that outlive a function call should own their data.",
        "`string_view` also carries the useful C++20 members `starts_with`, `ends_with` and `contains`, which `std::string` gained at the same time.",
      ],
      examples: [
        {
          id: "parameter-choice",
          title: "The four parameter shapes, and which to use",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <string_view>
#include <utility>

class Request {
public:
    // STORES a copy -> take by value and move. One move for rvalues,
    // one copy for lvalues, and never worse than the alternatives.
    explicit Request(std::string url) : url_(std::move(url)) {}

    // READS only -> string_view. Accepts everything, allocates nothing.
    static bool isSecure(std::string_view url) {
        return url.starts_with("https://");
    }

    // Needs a real C string for a C API -> const std::string&.
    void logWith(const std::string& prefix) const {
        // prefix.c_str() is guaranteed null-terminated; a view's data() is not
        std::cout << "  " << prefix.c_str() << ' ' << url_ << '\\n';
    }

    // RETURNS owned data -> std::string, never a view of a local.
    std::string host() const {
        auto start = url_.find("://");
        if (start == std::string::npos) return {};
        start += 3;
        auto end = url_.find('/', start);
        return url_.substr(start, end - start);
    }

private:
    std::string url_;
};

int main() {
    Request r{"https://example.com/api/v1/users"};   // literal -> one alloc, then moved

    std::string existing = "http://plain.example.org/x";
    Request r2{existing};                            // lvalue -> one copy

    std::cout << std::boolalpha;
    std::cout << "isSecure(literal)      = "
              << Request::isSecure("https://x.test") << '\\n';
    std::cout << "isSecure(std::string)  = "
              << Request::isSecure(existing) << '\\n';
    std::cout << "isSecure(string_view)  = "
              << Request::isSecure(std::string_view{existing}) << '\\n';

    r.logWith("[req]");
    r2.logWith("[req]");

    std::cout << "host of r  = " << r.host() << '\\n';
    std::cout << "host of r2 = " << r2.host() << '\\n';
}`,
          output: `isSecure(literal)      = true
isSecure(std::string)  = false
isSecure(string_view)  = false
  [req] https://example.com/api/v1/users
  [req] http://plain.example.org/x
host of r  = example.com
host of r2 = plain.example.org`,
          explanation:
            "**`isSecure` accepted a literal, a `std::string` and a `string_view` with no conversions and no allocations** — that flexibility is the everyday reason to use the type. The constructor takes `std::string` by value because it stores one, so the literal call allocates once and then moves, and the lvalue call copies once; taking `const std::string&` would have copied in both cases. And `host()` returns an owning `std::string` rather than a view, because the substring must outlive the call.",
        },
      ],
    },
    {
      id: "dangers",
      heading: "The two ways `string_view` bites",
      body: [
        "**It does not own anything, so it can dangle** — and this is easier to do than with a reference, because a `string_view` is a value you can copy, return and store.",
        "The classic form is `std::string_view v = makeString();`. The temporary is destroyed at the end of that statement, and `v` refers to freed memory from the next line onwards. It looks like an ordinary initialisation and **compiles without a warning on GCC 14 at `-Wall -Wextra`**.",
        "The same happens with `std::string_view v = someString + \"suffix\";`, with a view returned from a function that took its argument by value, and with a view stored in a member while the owner is a local.",
        "**Lifetime-bound annotations and sanitizers are the practical defences.** AddressSanitizer catches the read reliably; Clang has `[[clang::lifetimebound]]` on the relevant standard library functions and will warn.",
        "**The second hazard: a `string_view` is not null-terminated.** `data()` returns a pointer to the first character with no guarantee of a `\\0` at `data() + size()`, because the view may be a slice of a longer string. Passing `data()` to `printf(\"%s\")`, `fopen`, or any C API reads past the end. **When a C API needs a C string, construct a `std::string` from the view and call `c_str()`** — that is the one place the copy is unavoidable and correct.",
      ],
      examples: [
        {
          id: "dangling",
          title: "Views into things that are already gone",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <string_view>

std::string_view viewOf(const std::string& s) {
    return std::string_view{s};   // fine in itself -- see the call site
}

std::string makeName() { return "a temporary name that is long enough"; }

int main() {
    // 1. A view into a temporary that has already died.
    std::string_view v1 = makeName();       // temporary destroyed HERE
    std::cout << "reading a view into a dead temporary is undefined behaviour\\n";
    (void)v1;

    // 2. The same bug one level of indirection away.
    std::string_view v2 = viewOf(makeName());
    (void)v2;

    // 3. Correct: keep the owner alive.
    std::string owner = makeName();
    std::string_view good{owner};
    std::cout << "safe view: " << good << '\\n';

    // 4. string_view is NOT null-terminated.
    const char* cstr = "hello world";
    std::string_view part{cstr, 5};         // "hello", but no '\\0' after it
    std::cout << "part.size() = " << part.size() << ", part = " << part << '\\n';
    std::cout << "printf(\\"%s\\") on part.data() would run past the end.\\n";
    std::cout << "Use std::string{part}.c_str() when a C API needs a C string.\\n";
}`,
          output: `$ g++ -std=c++20 -Wall -Wextra dangling.cpp    # no warnings at all

reading a view into a dead temporary is undefined behaviour
safe view: a temporary name that is long enough
part.size() = 5, part = hello
printf("%s") on part.data() would run past the end.
Use std::string{part}.c_str() when a C API needs a C string.`,
          explanation:
            "**Cases 1 and 2 are undefined behaviour and GCC 14 said nothing at `-Wall -Wextra`.** That silence is the real hazard: `std::string_view v = makeName();` looks exactly like the safe `std::string v = makeName();` one line away. Case 4 is the other trap — `part` covers five characters of an eleven-character literal, so `part.data()` points at `\"hello world\"` and any C function reading to a terminator gets the whole thing. Printing through `operator<<` is safe because it uses `size()`.",
        },
      ],
      pitfalls: [
        {
          title: "`std::string_view` has no `operator+`, and that is deliberate",
          body: "You cannot concatenate views, because the result would have to own storage and a view never does. `sv1 + sv2` does not compile, and the fix is `std::string{sv1} + std::string{sv2}` or building into a `std::string` with `append`. This trips people converting a codebase to views and is a useful reminder of what the type is: a way to *read* text you did not allocate, not a general-purpose string. If you find yourself fighting it, the answer is usually that this particular value should be an owning `std::string`.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the small-string optimisation?",
      answer:
        "An implementation technique where short strings are stored in a small buffer inside the `std::string` object itself rather than on the heap, so constructing them allocates nothing. It is why `sizeof(std::string)` is 32 on libstdc++ instead of the 16 a pointer-plus-size would need. The threshold is 15 characters on libstdc++ and 22 on libc++. It means advice about avoiding string copies applies unevenly: copying a string holding `\"GET\"` is 32 bytes and no allocation, while copying one holding a URL allocates every time.",
    },
    {
      question: "Why is `const std::string&` not always the right parameter type?",
      answer:
        "Because a caller passing a string literal — which is very common — must construct a temporary `std::string` first, and that allocates for anything past the SSO threshold. Measured over 100 calls with a long literal, a `const std::string&` parameter caused 100 allocations and a `std::string_view` parameter caused zero. `string_view` also accepts `const char*`, character buffers and other views without conversion. Take `const std::string&` only when the function genuinely needs a `std::string` — because it calls `c_str()` or forwards it to something that requires one.",
    },
    {
      question: "How should you choose between `string_view`, `const string&` and `string` by value?",
      answer:
        "`string_view` when the function only reads the characters and does not store them — it accepts every string-like thing with no conversion. `const std::string&` when the function needs an actual `std::string`, typically for `c_str()`. `std::string` by value, combined with `std::move` into the member, when the function stores a copy: that gives one move for rvalue callers and one copy for lvalue callers, where `const std::string&` plus a copy into the member always copies. And return `std::string` rather than a view unless the referent demonstrably outlives the call.",
    },
    {
      question: "What are the two main hazards of `std::string_view`?",
      answer:
        "Dangling and the missing null terminator. It owns nothing, so `std::string_view v = makeString();` leaves `v` pointing at a temporary destroyed at the end of that statement — undefined behaviour that GCC 14 compiles silently at `-Wall -Wextra`, and which looks identical to the safe `std::string v = makeString();`. Separately, `data()` is not guaranteed null-terminated, because the view may be a slice of a longer buffer, so passing it to `printf(\"%s\")` or any C API reads past the end. When a C API needs a C string, construct a `std::string` from the view and call `c_str()`.",
    },
    {
      question: "Why does `std::string_view` have no `operator+`?",
      answer:
        "Because the result would have to own storage, and a view never owns anything — there is nowhere for the concatenated characters to live. It is a deliberate omission rather than a gap. To concatenate you must produce an owning string: `std::string{a} + std::string{b}`, or append into a `std::string`. Running into it usually means the value in question should have been an owning `std::string` in the first place; `string_view` is for reading text somebody else allocated, not a general-purpose string replacement.",
    },
  ],
  takeaways: [
    "Short strings live inside the `std::string` object — 15 chars on libstdc++, 22 on libc++",
    "`sizeof(std::string)` is 32; `sizeof(std::string_view)` is 16 and never allocates",
    "A `const std::string&` parameter allocates when the caller passes a literal",
    "100 calls: `const std::string&` cost 100 allocations, `string_view` cost 0",
    "`std::string::substr` copies and allocates; `string_view::substr` adjusts a pointer",
    "Take `string_view` for read-only parameters, `const string&` when you need `c_str()`",
    "Take `std::string` by value and `std::move` it when the function stores a copy",
    "Return `std::string`, not a view of a local or parameter",
    "A view into a temporary dangles, and GCC compiles it without warning",
    "`data()` is not null-terminated — build a `std::string` before calling any C API",
    "`string_view` has no `operator+`, because the result would need to own storage",
  ],
  status: "available",
};
