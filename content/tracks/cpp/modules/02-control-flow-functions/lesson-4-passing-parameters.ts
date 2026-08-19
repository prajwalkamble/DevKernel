import type { Lesson } from "@/content/types";

export const passingParametersLesson: Lesson = {
  id: "cpp-passing-parameters",
  slug: "passing-parameters",
  moduleSlug: "control-flow-functions",
  title: "Passing by Value, by Reference & by const Reference",
  summary:
    "The decision you make on every function signature you write: whether the caller's object is copied, exposed, or lent read-only — what each costs, what each permits, and the dangling reference that outlives what it points at.",
  estimatedMinutes: 30,
  objectives: [
    "Explain what a reference is and how it differs from the object it names",
    "Choose between by-value, by-reference and by-const-reference deliberately",
    "Demonstrate the copy that by-value passing performs",
    "Use an out-parameter, and know why returning a value is usually better",
    "Recognise a dangling reference and the warning that catches it",
  ],
  sections: [
    {
      id: "references",
      heading: "What a reference is",
      body: [
        "A **reference** is an alias: another name for an existing object. `int& r = x;` makes `r` and `x` two names for the same storage. Assigning through `r` changes `x`, because there is only one object.",
        "Three rules define references and they are worth stating precisely.",
        "**A reference must be initialised**, and it is bound at that moment. `int& r;` does not compile.",
        "**A reference cannot be rebound.** After `int& r = x;`, writing `r = y;` does not make `r` refer to `y` — it assigns `y`'s *value* into `x`. This is the single most common misunderstanding, and it is why references cannot be used where you need to change what you are pointing at. That is a pointer's job, covered in module 3.",
        "**A reference has no null state.** There is no such thing as a reference that refers to nothing, so a function taking `Widget&` need not check for null. That guarantee is a large part of why references are preferred to pointers for parameters.",
      ],
    },
    {
      id: "three-ways",
      heading: "The three ways to take a parameter",
      body: [
        "**By value** — `void f(T t)`. The caller's object is **copied** into the parameter. The function gets its own independent object; changes do not affect the caller. Cost: one copy, which is free for an `int` and expensive for a `std::vector` of a million elements.",
        "**By reference** — `void f(T& t)`. The parameter is an alias for the caller's object. No copy. Changes *do* affect the caller — which is either the point or a bug, depending on whether you intended it.",
        "**By const reference** — `void f(const T& t)`. An alias the function may read but not modify. No copy, no mutation. **This is the default for anything that is not a small built-in type.**",
        "The decision procedure that covers almost every case:",
        "**Small and cheap to copy** — `int`, `double`, `char`, a pointer, a small struct of a few such members — **pass by value**. A copy is one machine instruction, and passing a reference would add an indirection that is likely slower.",
        "**Large, and the function only reads it** — **pass by `const&`**. Strings, vectors, maps, any class with a non-trivial constructor.",
        "**The function must modify the caller's object** — **pass by `&`**, and consider whether returning a new value would be clearer.",
        "**The function needs its own copy to keep or modify** — **pass by value** deliberately, and move from it. This is the C++11 \"sink parameter\" idiom, which module 5 covers.",
      ],
      examples: [
        {
          id: "three-ways-demo",
          title: "All three, with the copy made visible",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

void by_value(int n)        { n = 99; }
void by_reference(int& n)   { n = 99; }
void by_const_ref(const std::string& s) { std::cout << s.size() << ' '; }

// Counts how many times it is copied.
struct Tracked {
    std::string data;
    Tracked(std::string d) : data(std::move(d)) {}
    Tracked(const Tracked& other) : data(other.data) {
        std::cout << "[copied] ";
    }
};

void takes_value(Tracked t)            { (void)t; }
void takes_const_ref(const Tracked& t) { (void)t; }

int main() {
    int a = 1;
    by_value(a);      std::cout << "after by_value: "      << a << '\\n';
    by_reference(a);  std::cout << "after by_reference: "  << a << '\\n';

    std::string s = "hello";
    by_const_ref(s);
    std::cout << '\\n';

    Tracked t{"payload"};
    std::cout << "takes_value:     "; takes_value(t);     std::cout << '\\n';
    std::cout << "takes_const_ref: "; takes_const_ref(t); std::cout << "(no copy)\\n";
}`,
          output: `after by_value: 1
after by_reference: 99
5
takes_value:     [copied]
takes_const_ref: (no copy)`,
          explanation:
            "The `Tracked` struct makes the invisible visible: its copy constructor prints, so `[copied]` appears exactly when a copy happens. **Passing by value copied the object; passing by `const&` did not.** For a struct holding one short string that is a wasted allocation; for one holding a large vector it is the difference between a function call and a memory copy of megabytes.",
        },
      ],
      pitfalls: [
        {
          title: "`const&` still binds to a temporary, and that is deliberate",
          body: "`by_const_ref(\"hello\")` works even though the argument is a string literal, not a `std::string` — a temporary `std::string` is constructed and the reference binds to it, and the temporary lives until the end of the full expression. A non-const `T&` will *not* bind to a temporary, which is a deliberate safety rule: modifying a temporary that is about to be destroyed is almost always a mistake, so the language rejects it.",
        },
      ],
    },
    {
      id: "out-parameters",
      heading: "Out-parameters, and why to avoid most of them",
      body: [
        "A non-const reference parameter used purely to return data is an **out-parameter**. It was the standard way to return multiple values before C++11, and it survives in a lot of code.",
        "The problem is that a call site tells you nothing: `process(data, result);` gives no clue that `result` is modified. You have to go and read the signature. Compare `auto result = process(data);`, where it is obvious.",
        "Modern C++ has better answers for nearly every case. **Return a struct** when the values belong together and deserve names. **Return a `std::pair` or `std::tuple`** for a quick pair of values, unpacked with structured bindings. **Return `std::optional<T>`** when the operation may legitimately produce nothing. **Return `std::expected<T, E>`** (C++23) when it may fail with a reason.",
        "Returning by value is also not the performance cost it once was: copy elision means the returned object is typically constructed directly in the caller's storage, with no copy at all. Module 5 covers that guarantee.",
        "Out-parameters remain defensible in two situations: when you are filling a buffer the caller already owns and wants reused across calls (avoiding repeated allocation in a hot loop), and when matching an existing C API.",
      ],
      examples: [
        {
          id: "out-vs-return",
          title: "The same operation, both ways",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

struct Stats { int min; int max; double mean; };

// Old style: three out-parameters. The call site says nothing.
void analyse_out(const std::vector<int>& v, int& min, int& max, double& mean) {
    min = v[0]; max = v[0]; double total = 0;
    for (int x : v) { if (x < min) min = x; if (x > max) max = x; total += x; }
    mean = total / static_cast<double>(v.size());
}

// Modern: one return value with named fields.
Stats analyse(const std::vector<int>& v) {
    Stats s{v[0], v[0], 0.0};
    double total = 0;
    for (int x : v) { if (x < s.min) s.min = x; if (x > s.max) s.max = x; total += x; }
    s.mean = total / static_cast<double>(v.size());
    return s;
}

int main() {
    std::vector<int> data{4, 8, 15, 16, 23, 42};

    int lo{}, hi{}; double avg{};
    analyse_out(data, lo, hi, avg);
    std::cout << lo << ' ' << hi << ' ' << avg << '\\n';

    auto [min, max, mean] = analyse(data);      // structured binding
    std::cout << min << ' ' << max << ' ' << mean << '\\n';
}`,
          output: `4 42 18
4 42 18`,
          explanation:
            "Identical results, and the second version is better in three ways: the call site shows that a value comes out, the fields have names so the order cannot be mixed up, and the variables can be `const`. **Note the `static_cast<double>(v.size())`** — without it, `total / v.size()` divides a `double` by an unsigned integer, which works here but is exactly the signed/unsigned mixing worth being deliberate about.",
        },
      ],
    },
    {
      id: "dangling",
      heading: "The dangling reference",
      body: [
        "A reference is an alias for an object. If that object is destroyed and the reference is still around, **the reference now names storage that no longer holds it**. Using it is undefined behaviour.",
        "The most direct way to produce one is to return a reference to a local variable. The local is destroyed at the function's closing brace, and the caller receives a reference to a dead object.",
        "`-Wreturn-local-addr`, in `-Wall`, catches the obvious case. It cannot catch every case — a reference stored in a struct that outlives the referent, for instance — which is why lifetime is something you have to reason about rather than delegate.",
        "The rule that keeps you safe: **a reference must not outlive what it refers to.** Return by value unless you are returning a reference to something that demonstrably outlives the call — a member of an object the caller owns, or an element of a container the caller passed in.",
      ],
      examples: [
        {
          id: "dangling-reference",
          title: "A reference to a destroyed local",
          lang: "cpp",
          code: `#include <iostream>

// Returning a reference to a local: the local is destroyed at the closing brace.
int& broken() {
    int local = 42;
    return local;      // dangling
}

int main() {
    int& r = broken();
    std::cout << r << '\\n';
}`,
          output: `warning: reference to local variable 'local' returned [-Wreturn-local-addr]
    5 |     return local;      // dangling
      |            ^~~~~
note: declared here
    4 |     int local = 42;

$ ./a.out          # built with -fsanitize=address
AddressSanitizer: SEGV on unknown address 0x000000000000
The signal is caused by a READ memory access.`,
          explanation:
            "The compiler warned, and the program crashed. Note that it did **not** print 42 and carry on — which it might well have done on a different build, and that is the danger. The value is sometimes still sitting in that stack slot, so this bug can appear to work for months.",
        },
      ],
      pitfalls: [
        {
          title: "Binding a `const&` to a temporary extends its life — but only in the direct case",
          body: "`const std::string& s = make_string();` is legal: the temporary's lifetime is extended to match the reference. But `const std::string& s = make_pair().first;` is not covered by that rule in the way people expect, and neither is storing a `const&` parameter into a member. Lifetime extension applies when a temporary is bound *directly* to a local reference, and it does not propagate through function returns. When in doubt, take a copy.",
        },
      ],
    },
    {
      id: "arrays",
      heading: "Arrays do not pass by value",
      body: [
        "One special case worth knowing before module 3 covers it properly. **A raw array parameter silently becomes a pointer.**",
        "`void f(int arr[10])` looks like it takes an array of ten integers. It does not — it takes an `int*`, the size is discarded, and `sizeof(arr)` inside the function gives you the size of a pointer. The caller can pass an array of any length, and there is no bounds information to check against.",
        "This is called **array decay** and it is inherited from C. It is the reason C++ code that passes raw arrays around is a common source of buffer overruns.",
        "The fix is to not pass raw arrays. Use `std::vector` when the size varies, `std::array<int, 10>` when it is fixed (which *does* pass by value and knows its own size), or `std::span<int>` (C++20) for a non-owning view over a contiguous range that carries its length with it.",
      ],
      examples: [
        {
          id: "array-decay",
          title: "The size vanishes at the function boundary",
          lang: "cpp",
          code: `#include <iostream>
#include <array>
#include <span>

void takes_array(int arr[10]) {         // actually takes int*
    std::cout << "inside:  " << sizeof(arr) << " bytes\\n";
}

void takes_span(std::span<const int> s) {
    std::cout << "span:    " << s.size() << " elements\\n";
}

int main() {
    int data[10]{};
    std::cout << "outside: " << sizeof(data) << " bytes\\n";
    takes_array(data);
    takes_span(data);

    std::array<int, 10> safe{};
    std::cout << "std::array knows: " << safe.size() << " elements\\n";
}`,
          output: `decay.cpp: In function 'void takes_array(int*)':
warning: 'sizeof' on array function parameter 'arr' will return size of 'int*'
         [-Wsizeof-array-argument]

outside: 40 bytes
inside:  8 bytes
span:    10 elements
std::array knows: 10 elements`,
          explanation:
            "**40 bytes outside, 8 inside** — the array became a pointer and the length was thrown away. Look at how GCC names the function in its own diagnostic: **`void takes_array(int*)`**, not `int[10]`. The compiler is telling you outright that the parameter type you wrote is not the parameter type you got. `std::span` is the modern fix: it is exactly a pointer plus a length, costs nothing more than passing the pointer did, and every function that takes one knows how many elements it has. Pass `std::span<const T>` for read-only access.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a reference, and how does it differ from a pointer?",
      answer:
        "A reference is an alias — another name for an existing object. It must be initialised, cannot be rebound afterwards, and has no null state. Assigning to a reference assigns to the referenced object rather than changing what it refers to. A pointer is a variable holding an address: it can be null, reassigned, and have arithmetic done on it. Because a reference cannot be null, a function taking `T&` need not check, which is why references are preferred for parameters unless the argument is genuinely optional.",
    },
    {
      question: "How do you decide between passing by value, by reference and by const reference?",
      answer:
        "By value for small cheap-to-copy types — the built-ins, pointers, and small structs of those — where a copy is a register move and an indirection would be slower. By `const&` for anything large that the function only reads, which is the default for strings, containers and most class types. By `&` when the function must modify the caller's object. And by value deliberately when the function needs its own copy to keep, since that lets the caller move into it.",
    },
    {
      question: "What is wrong with out-parameters?",
      answer:
        "The call site conveys nothing — `process(data, result)` gives no indication that `result` is modified, so you have to read the signature to know. They also force the variables to be declared uninitialised beforehand, so they cannot be `const`. Modern C++ returns a struct with named fields, a `std::pair` unpacked with structured bindings, `std::optional` when the result may be absent, or `std::expected` when it may fail. Copy elision means returning by value is not the cost it once was. Out-parameters remain reasonable for reusing a caller-owned buffer in a hot loop or matching a C API.",
    },
    {
      question: "What is a dangling reference and how do you avoid one?",
      answer:
        "A reference to an object that has been destroyed — most commonly produced by returning a reference to a local, which dies at the function's closing brace. Using it is undefined behaviour, and the dangerous part is that the value is often still in that stack slot, so the code appears to work. `-Wreturn-local-addr` catches the direct case but not references stored in longer-lived objects. The rule is that a reference must not outlive what it refers to: return by value unless you are returning a reference to something the caller demonstrably owns.",
    },
    {
      question: "What happens when you pass a raw array to a function?",
      answer:
        "It decays to a pointer. `void f(int arr[10])` genuinely takes an `int*`; the size is discarded and `sizeof(arr)` inside gives the size of a pointer, typically 8 rather than 40. The caller may pass an array of any length and nothing checks. That is why raw arrays are a classic source of buffer overruns. Use `std::vector` for a dynamic size, `std::array<T, N>` for a fixed one — it does pass by value and knows its size — or `std::span` for a non-owning view that carries its length.",
    },
  ],
  takeaways: [
    "A reference is an alias: it must be initialised, cannot be rebound, and cannot be null",
    "Assigning to a reference assigns to the referenced object — it never changes what it refers to",
    "By value for small built-ins; `const&` for anything large that is only read; `&` when you must modify the caller's object",
    "A `const&` binds to a temporary; a non-const `T&` deliberately will not",
    "Prefer returning a struct, `pair`, `optional` or `expected` to out-parameters — the call site shows what happens",
    "Returning by value is cheap: copy elision constructs the result directly in the caller's storage",
    "A reference must not outlive what it refers to; returning a reference to a local is undefined behaviour",
    "Raw arrays decay to pointers at a function boundary — use `std::span`, `std::array` or `std::vector`",
  ],
  status: "available",
};
