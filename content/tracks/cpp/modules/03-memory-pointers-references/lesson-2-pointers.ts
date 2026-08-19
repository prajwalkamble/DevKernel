import type { Lesson } from "@/content/types";

export const pointersLesson: Lesson = {
  id: "cpp-pointers",
  slug: "pointers",
  moduleSlug: "memory-pointers-references",
  title: "Pointers: Addresses, Dereferencing & nullptr",
  summary:
    "A pointer is a variable holding an address — that is the whole idea. What `&` and `*` do, why `nullptr` replaced `NULL` and `0`, why the declaration syntax misleads everyone once, and when to use a pointer instead of a reference.",
  estimatedMinutes: 30,
  objectives: [
    "Explain what a pointer stores and what `&` and `*` do",
    "Declare pointers correctly, including several on one line",
    "Use `nullptr` and explain why it replaced `NULL`",
    "Choose between a pointer and a reference for a given job",
    "Recognise the three ways a dereference goes wrong",
  ],
  sections: [
    {
      id: "what-is-a-pointer",
      heading: "A pointer is a variable holding an address",
      body: [
        "Every byte of a program's memory has a numeric address. A **pointer** is an ordinary variable whose value is one of those numbers.",
        "That is genuinely all a pointer is. The mystique around them comes from the syntax and from what goes wrong, not from the concept.",
        "Two operators do the work. **`&x`** — the address-of operator — yields the address of `x`. **`*p`** — the dereference operator — yields *the object at* the address in `p`, and can be read or assigned to.",
        "The type matters. An `int*` and a `double*` are the same size (8 bytes on a 64-bit machine — they both hold an address) but they are different types, because the type tells the compiler how to interpret the bytes at that address and how far to step in pointer arithmetic.",
      ],
      examples: [
        {
          id: "pointer-basics",
          title: "Every pointer operation in one program",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    int value = 42;
    int* p = &value;          // p holds the address of value

    std::cout << "value:  " << value  << '\\n';
    std::cout << "&value: " << &value << '\\n';
    std::cout << "p:      " << p      << '\\n';
    std::cout << "*p:     " << *p     << '\\n';

    *p = 99;                  // write through the pointer
    std::cout << "value after *p = 99: " << value << '\\n';

    int* nothing = nullptr;   // explicitly points at nothing
    std::cout << "nothing == nullptr? " << std::boolalpha
              << (nothing == nullptr) << '\\n';

    std::cout << "sizeof(int*) = " << sizeof(int*)
              << ", sizeof(double*) = " << sizeof(double*) << '\\n';
}`,
          output: `value:  42
&value: 0x7ffef01068ec
p:      0x7ffef01068ec
*p:     42
value after *p = 99: 99
nothing == nullptr? true
sizeof(int*) = 8, sizeof(double*) = 8`,
          explanation:
            "**`&value` and `p` print the same number** — that is the entire relationship. Writing `*p = 99` changed `value`, because there is only one object and `p` names its location. Both pointer types are 8 bytes: an address is an address regardless of what it points at. The size is a property of the *machine*, not of the pointed-to type.",
        },
      ],
      pitfalls: [
        {
          title: "`int* a, b;` declares one pointer and one int",
          body: "The `*` binds to the *declarator*, not to the type. So `int* a, b;` gives you an `int*` called `a` and a plain `int` called `b` — almost certainly not what was intended. `int *a, *b;` declares two pointers. This is why many style guides say to declare one variable per line, which sidesteps the question entirely. The `int* p` spelling (star with the type) reads better and is more common in C++; the `int *p` spelling (star with the name) is more honest about the grammar. Pick one and be consistent.",
        },
      ],
    },
    {
      id: "nullptr",
      heading: "nullptr, and why NULL had to go",
      body: [
        "A pointer that points at nothing should say so. C++11 introduced `nullptr` for this, and it replaced two worse options.",
        "**`0`** worked because a literal zero converts to any pointer type. But it is an integer, so it participates in integer overload resolution and reads as a number.",
        "**`NULL`** is a macro, and — importantly — **what it expands to is implementation-defined.** MSVC defines it as `0`. GCC and Clang define it as `__null`, a compiler extension. That difference is not academic: the same code behaves differently across toolchains, as the example below shows.",
        "**`nullptr`** has its own type, `std::nullptr_t`. It converts to any pointer type and to nothing else, which fixes the overload problem below and makes the intent unambiguous on every compiler.",
        "Dereferencing a null pointer is **undefined behaviour**. On a typical desktop OS the hardware traps the access to address zero and you get a segmentation fault, which is the friendly outcome; on an embedded system with no memory protection, address zero may be a real, writable register.",
      ],
      examples: [
        {
          id: "nullptr-overload",
          title: "The overload bug nullptr fixes",
          lang: "cpp",
          code: `#include <iostream>

void handle(int n)     { std::cout << "handle(int): " << n << '\\n'; }
void handle(char* s)   { std::cout << "handle(char*)\\n"; }

int main() {
    handle(0);          // int — it is a literal zero
    handle(nullptr);    // char* — nullptr has its own type
    // handle(NULL);    // depends on your compiler! see below
}`,
          output: `handle(int): 0
handle(char*)

// Uncomment the NULL line. On GCC and Clang, where NULL is __null:
error: call of overloaded 'handle(NULL)' is ambiguous
    6 |     handle(NULL);
      |     ~~~~~~^~~~~~
note: candidate: 'void handle(int)'
note: candidate: 'void handle(char*)'

// On MSVC, where NULL is 0, it compiles and silently calls handle(int).`,
          explanation:
            "**Three spellings, three different outcomes.** `handle(0)` silently picks the integer overload — the programmer probably meant the pointer one, and nothing warns. `handle(NULL)` is a **compile error on GCC and Clang** because `__null` is ambiguous between the two, and a **silent wrong call on MSVC** because there `NULL` is just `0`. Only `nullptr` does the right thing, and does it identically everywhere. **Use `nullptr` always**; treat `NULL` in existing code as something to modernise.",
        },
      ],
    },
    {
      id: "pointer-vs-reference",
      heading: "Pointer or reference?",
      body: [
        "Both give you indirect access to an object. They differ in three ways, and those differences decide which to use.",
        "**A reference must be initialised and cannot be null.** A pointer can be null, and a function receiving one has to decide whether to check.",
        "**A reference cannot be rebound.** A pointer can be reassigned to point somewhere else.",
        "**A pointer can do arithmetic.** A reference cannot.",
        "So the decision procedure is short. **Use a reference by default** — for parameters, for return values that alias something the caller owns, and anywhere the target always exists. **Use a pointer when the thing can genuinely be absent** (and then it must be checked), **when you need to change what you are pointing at** (an iterator-style walk, a linked structure), **when you need arithmetic**, or **when ownership is involved** — in which case use a *smart* pointer, not a raw one.",
        "A useful way to read a signature: **a `T&` parameter says \"this must exist\". A `T*` parameter says \"this might be null, and I will check\".** When you see a function taking `T*` and never checking, that is a bug or a badly documented precondition.",
      ],
      examples: [
        {
          id: "pointer-optional",
          title: "A pointer as an optional parameter",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

// The reference form: \`out\` must exist, no check needed.
void parse(const std::string& text, int& result) {
    result = std::stoi(text);
}

// The pointer form: the caller may not want the extra output.
bool parse_with_optional_error(const std::string& text, int& result,
                               std::string* error_message) {
    try {
        result = std::stoi(text);
        return true;
    } catch (const std::exception& e) {
        if (error_message) *error_message = e.what();   // the check
        return false;
    }
}

int main() {
    int n = 0;
    parse("42", n);
    std::cout << n << '\\n';

    std::string why;
    if (!parse_with_optional_error("abc", n, &why))
        std::cout << "failed: " << why << '\\n';

    // Caller that does not care about the message passes nullptr.
    if (!parse_with_optional_error("xyz", n, nullptr))
        std::cout << "failed, message not requested\\n";
}`,
          output: `42
failed: stoi
failed, message not requested`,
          explanation:
            "The pointer parameter is doing real work here: it encodes \"optional\" in the type, and the `if (error_message)` check is the price. **In modern C++ you would usually return `std::expected<int, std::string>` instead** (module 10), which removes both the out-parameter and the null check. But this pattern is everywhere in existing code, and recognising *why* the pointer is a pointer is the point.",
        },
      ],
    },
    {
      id: "dereference-failures",
      heading: "The three ways a dereference goes wrong",
      body: [
        "Every pointer bug is one of these, and naming them makes them easier to spot in review.",
        "**Null.** The pointer holds `nullptr` and you dereferenced it. Usually a crash, and therefore the *best* of the three, because it fails loudly and immediately.",
        "**Dangling.** The pointer holds an address that was valid and no longer is — the object was destroyed or freed. This is the dangerous one: the memory often still contains the old bytes, so the program appears to work. Lesson 5 covers it in detail.",
        "**Uninitialised.** The pointer was never assigned and holds whatever bytes were on the stack. Dereferencing it accesses an arbitrary address. **Always initialise pointers**, to `nullptr` if you have nothing better.",
        "One more, easy to miss: **the pointer is fine but the arithmetic went out of bounds.** Lesson 3 covers that.",
      ],
      examples: [
        {
          id: "null-check-patterns",
          title: "Checking, and the guard-clause shape",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

struct User { std::string name; };

// Guard clause: handle the absent case first, then the happy path
// runs unindented for the rest of the function.
void greet(const User* user) {
    if (!user) {
        std::cout << "no user\\n";
        return;
    }
    std::cout << "hello " << user->name << '\\n';
}

int main() {
    User u{"Ada"};
    greet(&u);
    greet(nullptr);

    // \`->\` is (*p).member — the arrow exists because the parenthesised
    // form is unreadable once you nest it.
    const User* p = &u;
    std::cout << (*p).name << " == " << p->name << '\\n';
}`,
          output: `hello Ada
no user
Ada == Ada`,
          explanation:
            "`if (!user)` and `if (user == nullptr)` are identical; the first is more common. **The guard-clause shape — check the bad case, return, then carry on — is worth adopting as a habit**, because the alternative wraps the entire function body in an `if` and the indentation compounds with every additional check. `p->name` is exactly `(*p).name`, and the arrow exists because chains like `(*(*a).b).c` are unreadable.",
        },
      ],
      pitfalls: [
        {
          title: "Checking for null does not make a dangling pointer safe",
          body: "A dangling pointer is not null — it holds a perfectly ordinary-looking address that used to be valid. `if (p)` passes, the dereference reads freed memory, and the program continues with plausible-looking garbage. This is why \"just check for null\" is not a memory-safety strategy, and why the real answer is to make ownership explicit so the pointer cannot outlive its target. That is what lesson 7 and module 4 are about.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a pointer, and what do `&` and `*` do?",
      answer:
        "A pointer is an ordinary variable whose value is a memory address. `&x` yields the address of `x`, and `*p` yields the object stored at the address in `p`, which can be read or assigned. All pointers on a given machine are the same size — 8 bytes on 64-bit — because they all hold an address; the pointed-to type matters because it tells the compiler how to interpret those bytes and how far to step in pointer arithmetic.",
    },
    {
      question: "Why does `nullptr` exist when `NULL` and `0` already did?",
      answer:
        "Because both interact badly with overload resolution, and `NULL` does so inconsistently across compilers. A literal `0` is an integer, so given `handle(int)` and `handle(char*)` the call `handle(0)` silently picks the integer overload. `NULL` is implementation-defined: MSVC defines it as `0` and behaves the same way, while GCC and Clang define it as `__null`, which makes the call a compile error for ambiguity. So the same source behaves differently on different toolchains. `nullptr` has its own type, `std::nullptr_t`, converts to any pointer type and to nothing else, and therefore selects the pointer overload identically everywhere.",
    },
    {
      question: "When would you use a pointer rather than a reference?",
      answer:
        "When the target can genuinely be absent, so you need a null state and a check; when you need to change what you refer to, as in walking a linked structure; when you need pointer arithmetic; or when ownership is involved — and then a smart pointer rather than a raw one. Otherwise prefer a reference, because it cannot be null and needs no check. Reading a signature, `T&` says the argument must exist while `T*` says it may be null and the function will check — a `T*` parameter that is never checked is a bug or an undocumented precondition.",
    },
    {
      question: "What does `int* a, b;` declare?",
      answer:
        "An `int*` named `a` and a plain `int` named `b`. The `*` binds to the declarator rather than to the type, so it applies only to the first name. `int *a, *b;` declares two pointers. This is the main argument for declaring one variable per line, which makes the question moot regardless of whether you write the star next to the type or next to the name.",
    },
    {
      question: "What are the ways dereferencing a pointer can go wrong?",
      answer:
        "Null — usually a clean crash, which makes it the least dangerous. Dangling — the object it pointed to was destroyed, but the memory often still holds the old bytes, so the program appears to work and fails unpredictably later. Uninitialised — the pointer holds stack garbage and the dereference hits an arbitrary address. And out-of-bounds arithmetic on an otherwise valid pointer. Only the first is caught by a null check, which is why checking for null is not a memory-safety strategy; the answer is to make ownership explicit so pointers cannot outlive their targets.",
    },
  ],
  takeaways: [
    "A pointer is a variable holding an address; `&x` takes an address and `*p` accesses the object at one",
    "All pointers are the same size; the pointed-to type decides interpretation and arithmetic step",
    "`int* a, b;` declares a pointer and an int — declare one variable per line",
    "Use `nullptr`, never `NULL` or `0` — `NULL` is implementation-defined and behaves differently on GCC and MSVC",
    "`p->m` is exactly `(*p).m`; the arrow exists because the parenthesised form does not nest readably",
    "Prefer references; reach for a pointer when the target may be absent, must change, or is owned",
    "A `T*` parameter that is never checked for null is a bug or an undocumented precondition",
    "Null, dangling and uninitialised are the three failures — and a null check only catches the first",
  ],
  status: "available",
};
