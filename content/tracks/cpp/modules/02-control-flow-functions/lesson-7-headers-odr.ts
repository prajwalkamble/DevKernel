import type { Lesson } from "@/content/types";

export const headersOdrLesson: Lesson = {
  id: "cpp-headers-odr",
  slug: "headers-and-the-odr",
  moduleSlug: "control-flow-functions",
  title: "Headers, Translation Units & the One-Definition Rule",
  summary:
    "Splitting one file into many: what a translation unit is, what belongs in a header and what does not, include guards, the one-definition rule and the linker errors it produces — and what C++20 modules change.",
  estimatedMinutes: 35,
  objectives: [
    "Define a translation unit and explain why the compiler sees each one alone",
    "Split a program into `.h` and `.cpp` files correctly",
    "Write include guards, and know why `#pragma once` is not standard but is fine",
    "State the one-definition rule and recognise both errors it produces",
    "Use forward declarations to cut compile times",
    "Explain what C++20 modules fix",
  ],
  sections: [
    {
      id: "translation-units",
      heading: "What the compiler actually sees",
      body: [
        "A **translation unit** is one source file after the preprocessor has finished with it — your `.cpp` plus the full text of every header it included, transitively.",
        "The compiler processes **one translation unit at a time, in complete isolation.** It has no knowledge of your other files. That single fact explains the entire header system: if `main.cpp` calls a function defined in `math.cpp`, the compiler processing `main.cpp` has never seen that definition and cannot know the signature — unless you tell it, which is what a header does.",
        "So the model is: **headers carry declarations, source files carry definitions, and the linker connects them at the end.** A header is a promise (\"this exists somewhere\"), a source file is the fulfilment, and the linker checks every promise was kept.",
        "It follows that adding a header to your build changes nothing on its own. Headers are not compiled; they are pasted. Only `.cpp` files become translation units, and only translation units produce object files.",
      ],
      examples: [
        {
          id: "split-files",
          title: "One program, three files",
          lang: "cpp",
          code: `// ===== geometry.h — what other files may use =====
#pragma once            // process this file once per translation unit

struct Point { double x, y; };

// Declaration only — the definition lives in geometry.cpp.
double distance(Point a, Point b);

// inline permits the definition to appear in every translation unit
// that includes this header, without a duplicate-definition error.
inline double manhattan(Point a, Point b) {
    double dx = a.x - b.x, dy = a.y - b.y;
    return (dx < 0 ? -dx : dx) + (dy < 0 ? -dy : dy);
}

// ===== geometry.cpp — the implementation =====
#include "geometry.h"
#include <cmath>

double distance(Point a, Point b) {
    return std::sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

// ===== main.cpp — a consumer =====
#include "geometry.h"
#include <iostream>

int main() {
    Point a{0, 0}, b{3, 4};
    std::cout << distance(a, b) << ' ' << manhattan(a, b) << '\\n';
}`,
          output: `$ g++ -std=c++20 -Wall -Wextra main.cpp geometry.cpp -o app
$ ./app
5 7`,
          explanation:
            "**Both `.cpp` files go on the command line; the header does not.** `geometry.cpp` includes its own header deliberately — that way the compiler checks the definition against the declaration, so a signature that drifts out of sync becomes an error in the file you are editing rather than a linker error later. Make that a habit: **every `.cpp` includes its own header first.**",
        },
      ],
    },
    {
      id: "what-goes-where",
      heading: "What belongs in a header",
      body: [
        "**In the header:** class and struct definitions, function declarations, templates (which must be visible where they are instantiated), `inline` functions, `constexpr` functions and variables, type aliases, and enumerations.",
        "**In the source file:** function definitions, anything file-private, and every `#include` that only the implementation needs.",
        "Two rules that pay for themselves immediately.",
        "**Never write `using namespace std;` in a header.** Every file that includes yours inherits it and cannot opt out. This is the most commonly cited header sin, and it is genuinely the worst one, because the damage is invisible from the file that caused it.",
        "**Include as little as possible in a header.** Each `#include` in a header is paid by every translation unit that includes it, transitively. A header that pulls in `<vector>`, `<string>` and `<map>` when it only needs a forward declaration is a tax on your whole build.",
      ],
      pitfalls: [
        {
          title: "Include what you use, and do not rely on transitive includes",
          body: "If your file uses `std::string` and compiles because some other header happened to include `<string>`, it will break the day that header changes. Include `<string>` yourself. Standard library headers are explicitly allowed to include each other, so what you get transitively is unspecified and varies by implementation — which is why a file can compile on GCC and fail on MSVC for no visible reason. The tool `include-what-you-use` automates the audit.",
        },
      ],
    },
    {
      id: "include-guards",
      heading: "Include guards",
      body: [
        "Because `#include` is text substitution, including a header twice in one translation unit pastes its contents twice — and a class defined twice is an error. This happens constantly through indirect includes: `a.h` includes `common.h`, `b.h` includes `common.h`, and your `.cpp` includes both.",
        "**The traditional fix is an include guard**: a macro that makes the second inclusion expand to nothing. It is standard C++ and works everywhere.",
        "**The modern fix is `#pragma once`.** It is not in the standard, but every mainstream compiler — GCC, Clang, MSVC, Intel — supports it, and it is faster, since the compiler can skip the file without reading it. It also cannot suffer the guard-name collision that traditional guards can.",
        "Use `#pragma once`. Use traditional guards if your project targets an exotic compiler or its style guide requires them. **What you must not do is omit both.**",
      ],
      examples: [
        {
          id: "guard-forms",
          title: "Both forms, and the collision to avoid",
          lang: "cpp",
          code: `// Modern: one line, supported by every mainstream compiler.
#pragma once

// Traditional: standard C++, works everywhere.
#ifndef MYPROJECT_GEOMETRY_H
#define MYPROJECT_GEOMETRY_H
// ... contents ...
#endif  // MYPROJECT_GEOMETRY_H

// The failure mode of traditional guards: two different headers
// that happen to choose the same macro name. The second one to be
// included silently expands to nothing, and you get errors about
// undeclared types with no hint as to why.
//
//   utils/list.h   ->  #ifndef LIST_H
//   models/list.h  ->  #ifndef LIST_H     // this one vanishes`,
          explanation:
            "**Prefix guard names with the project and full path** — `MYPROJECT_GEOMETRY_H`, not `GEOMETRY_H` — precisely because of that collision. It is a real bug that has cost people entire afternoons, because the symptom (a type that suddenly does not exist) points nowhere near the cause. `#pragma once` uses the file's identity rather than a name you chose, so the problem cannot occur.",
        },
      ],
    },
    {
      id: "odr",
      heading: "The one-definition rule",
      body: [
        "The ODR has two halves, and they produce two very different failure modes.",
        "**Every entity may be *declared* many times but *defined* exactly once in the program.** Violating this gives you the linker error `multiple definition of ...` — which is annoying but honest, since it tells you the symbol and both locations.",
        "**Entities that may appear in multiple translation units — `inline` functions, templates, class definitions — must be *identical* in every one.** Violating this is undefined behaviour with **no diagnostic required**. The linker picks one definition arbitrarily, and your program silently does something you did not write.",
        "That second half is one of the nastiest bug classes in C++. It happens when a macro is defined differently before two includes of the same header, when a struct has a member under `#ifdef DEBUG` and half your build defines it, or when two libraries define a class with the same name in the global namespace.",
        "The defences: put your code in a namespace, keep build flags consistent across the whole project, avoid conditional compilation inside class definitions, and — where available — use the gold linker's `--detect-odr-violations` or build with the sanitizers, which catch some cases.",
      ],
      examples: [
        {
          id: "odr-violation",
          title: "The honest failure: multiple definition",
          lang: "cpp",
          code: `// --- bad.h ---
#pragma once
double twice(double x) { return x * 2; }   // NOT inline: defined in every TU

// --- a.cpp ---
#include "bad.h"
double use_a() { return twice(1.0); }

// --- b.cpp ---
#include "bad.h"
int main() { return 0; }`,
          output: `$ g++ -std=c++20 a.cpp b.cpp -o app
/usr/bin/ld: b.cpp:(.text+0x0): multiple definition of 'twice(double)';
             a.cpp:(.text+0x0): first defined here
collect2: error: ld returned 1 exit status`,
          explanation:
            "Note that **`#pragma once` did not prevent this.** Include guards stop a header being processed twice *within one* translation unit; they do nothing across translation units, because each one is compiled separately and knows nothing of the others. The fixes are to mark the function `inline`, or to move the definition into a `.cpp` and leave only a declaration in the header.",
        },
      ],
      pitfalls: [
        {
          title: "A class defined in a header is fine; a free function is not",
          body: "This asymmetry confuses people. Class definitions are explicitly permitted in multiple translation units by the ODR — that is how headers work at all — and member functions defined inside the class body are implicitly `inline`. A free function defined at namespace scope in a header has no such exemption and needs `inline` written out. The same applies to namespace-scope variables, which is what C++17's `inline` variables are for.",
        },
      ],
    },
    {
      id: "forward-declarations",
      heading: "Forward declarations and compile time",
      body: [
        "When a header only needs to know that a type *exists* — because it uses a pointer or reference to it — you can declare the type without defining it: `class Widget;`. That is a **forward declaration**.",
        "The payoff is compile time, and at scale it is large. Every `#include` in a header is re-read by every translation unit that pulls it in, transitively. Replacing an include with a forward declaration cuts that whole subtree out of the dependency graph — and, just as valuably, means that editing `widget.h` no longer forces a rebuild of every file that merely mentions a `Widget*`.",
        "You may forward-declare when you use a pointer or reference to the type, or declare (but do not define) a function returning or taking it by value.",
        "You need the **full definition** when you create an object of the type, call any member, use it by value as a member, inherit from it, or need `sizeof`.",
        "The systematic version of this is the **pimpl idiom** — a class whose header exposes only a pointer to an implementation struct declared but not defined. The entire implementation, and all its includes, then live in the `.cpp`. Module 14 covers it as a way of managing build times and ABI stability in production code.",
      ],
      examples: [
        {
          id: "forward-decl",
          title: "What a forward declaration permits",
          lang: "cpp",
          code: `// ===== renderer.h =====
#pragma once
// No #include "texture.h" — we only mention Texture indirectly.
class Texture;                       // forward declaration

class Renderer {
public:
    void draw(const Texture& t);     // OK: reference
    Texture* current() const;        // OK: pointer

    // Texture member_;              // ERROR: needs the full definition
private:
    Texture* current_ = nullptr;     // OK: pointer
};

// ===== renderer.cpp =====
#include "renderer.h"
#include "texture.h"                 // the full definition, only here

void Renderer::draw(const Texture& t) {
    // Now Texture's members are usable, because we included it.
}`,
          output: `// Uncommenting the by-value member gives exactly this:
renderer.h:8:13: error: field 'member_' has incomplete type 'Texture'
    8 |     Texture member_;
      |             ^~~~~~~
note: forward declaration of 'class Texture'`,
          explanation:
            "`renderer.h` compiles without ever reading `texture.h`. Every file that includes `renderer.h` saves that work, **and none of them rebuild when `texture.h` changes** — only `renderer.cpp` does. In a codebase with hundreds of files this is the difference between a two-second incremental build and a two-minute one.",
        },
      ],
    },
    {
      id: "modules",
      heading: "What C++20 modules change",
      body: [
        "Everything above is a workaround for one design decision made in 1972: `#include` is textual substitution. Modules replace it.",
        "**A module is compiled once, into a binary artefact, and imported.** No text is pasted, so the million-character expansion of `<iostream>` from module 1 happens once for the whole project rather than once per translation unit.",
        "What that fixes: build times (dramatically — the header is not reparsed per file), macro leakage (macros do not escape a module unless exported), include order sensitivity (an `import` cannot be affected by what came before it), and the ODR's identical-definition problem (there is one compiled definition).",
        "The honest state of adoption in 2026: the language feature is standardised and GCC, Clang and MSVC all implement it, but build-system and tooling support is still uneven, and the standard library modules (`import std;`) are C++23 and newer still. Most production codebases are still on headers, and will be for some years.",
        "So: **learn headers, because that is what you will read and write.** Know modules exist, understand what they fix, and expect to migrate eventually. Module 12 covers the practical setup.",
      ],
      examples: [
        {
          id: "module-syntax",
          title: "The same interface, as a module",
          lang: "cpp",
          code: `// ===== geometry.cppm — a module interface unit =====
export module geometry;

export struct Point { double x, y; };

export double distance(Point a, Point b);

// Not exported: private to the module, invisible to importers.
double square(double v) { return v * v; }

// ===== main.cpp =====
import geometry;
#include <iostream>

int main() {
    Point a{0, 0}, b{3, 4};
    std::cout << distance(a, b) << '\\n';
    // square(2.0);   // ERROR: not exported
}`,
          explanation:
            "Note what has disappeared: no include guard, no `inline` to appease the ODR, and no way for `main.cpp` to accidentally depend on `square`. **Everything is private unless exported**, which is the opposite default from a header, where everything you write is visible to every consumer.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a translation unit?",
      answer:
        "One source file after preprocessing — the `.cpp` plus the complete text of every header it included, transitively. It is the unit the compiler processes, and it processes each one in complete isolation with no knowledge of the others. That isolation is why headers exist: the compiler handling `main.cpp` has never seen a definition in `math.cpp`, so it needs a declaration to check the call against. Only `.cpp` files become translation units; headers are pasted, never compiled on their own.",
    },
    {
      question: "State the one-definition rule and describe both ways of violating it.",
      answer:
        "An entity may be declared many times but defined exactly once in the program; and entities permitted in several translation units — `inline` functions, templates, class definitions — must be token-for-token identical in each. Violating the first gives a linker error naming the symbol and both locations, which is annoying but honest. Violating the second is undefined behaviour with **no diagnostic required**: the linker picks one arbitrarily and the program silently misbehaves. That second form typically comes from inconsistent macros or build flags across a project, and it is one of the hardest C++ bug classes to track down.",
    },
    {
      question: "What is the difference between `#pragma once` and an include guard?",
      answer:
        "Both stop a header being processed twice within one translation unit. An include guard is standard C++ — an `#ifndef`/`#define`/`#endif` around the contents — while `#pragma once` is non-standard but supported by every mainstream compiler. `#pragma once` is faster, because the compiler can skip the file without reading it, and it cannot suffer the guard-name collision where two headers pick the same macro and the second silently vanishes. Neither has any effect across translation units, which is a common misconception.",
    },
    {
      question: "When can you use a forward declaration instead of an include?",
      answer:
        "When you only need to know the type exists: pointers and references to it, and declarations of functions that take or return it. You need the full definition to create an object, call a member, hold it by value as a member, inherit from it, or take `sizeof`. The payoff is build time — the include subtree disappears from every file that transitively pulled it in, and editing the omitted header no longer triggers a rebuild of everything that merely mentions a pointer to the type. The pimpl idiom is the systematic version.",
    },
    {
      question: "What do C++20 modules fix?",
      answer:
        "They replace textual inclusion with a compiled artefact that is built once and imported. That removes the per-translation-unit reparse cost that dominates C++ build times, stops macros leaking across boundaries, makes import order irrelevant, and eliminates the identical-definition half of the ODR since there is only one compiled definition. Everything in a module is private unless explicitly exported, which inverts the header default. All three major compilers implement them, but build-system and tooling support is still uneven, so most production code is still header-based.",
    },
  ],
  takeaways: [
    "A translation unit is one `.cpp` plus all its headers; the compiler sees each one in complete isolation",
    "Headers carry declarations, source files carry definitions, and the linker joins them",
    "Every `.cpp` should include its own header first, so signature drift is caught where you are editing",
    "Never write `using namespace std;` in a header — consumers inherit it and cannot opt out",
    "`#pragma once` is non-standard but universal, faster, and immune to guard-name collisions",
    "Include guards do nothing across translation units — that is what `inline` is for",
    "The ODR's identical-definition half is undefined behaviour with no diagnostic; keep build flags consistent",
    "Forward-declare when you only need a pointer or reference; the build-time saving compounds across a codebase",
  ],
  status: "available",
};
