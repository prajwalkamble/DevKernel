import type { Lesson } from "@/content/types";

export const modulesLesson: Lesson = {
  id: "cpp-modules",
  slug: "modules-as-the-successor-to-headers",
  moduleSlug: "build-tooling-testing",
  title: "Modules as the Successor to Headers, and What They Change",
  summary:
    "What `#include` actually costs, and what C++20 modules replace it with. A real module built with GCC 14 — including a function that is invisible to importers despite being at namespace scope — and an honest account of why adoption is still slow in 2026.",
  estimatedMinutes: 35,
  objectives: [
    "Explain what the preprocessor does and why it scales badly",
    "Write a module interface unit and import it",
    "Distinguish `export`, the global module fragment and the private fragment",
    "Say what modules fix beyond compile time",
    "Judge whether your project can adopt them yet",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "What `#include` costs",
      body: [
        "**`#include` is textual substitution.** The preprocessor pastes the entire header, and everything it includes, into your file before the compiler sees a token. That has consequences nobody would design on purpose.",
        "**The same header is reparsed in every translation unit that includes it.** `<vector>` pulls in tens of thousands of lines; a project with 500 source files including it parses those lines 500 times. This is why C++ builds are slow, and it is fundamental rather than an implementation weakness.",
        "**Order matters and is invisible.** Header A may compile only if header B was included first. Include guards prevent double inclusion but not order dependence, which is why projects adopt \"include your own header first\" rules.",
        "**Macros leak in both directions.** A macro defined before your include changes the meaning of the header's code, and a macro defined *by* a header affects everything after it. The canonical disaster is Windows' `<windows.h>` defining `min` and `max` as macros, breaking `std::min` in every file that includes it afterwards — the reason `NOMINMAX` exists.",
        "**There is no encapsulation.** Everything a header declares is visible to everyone who includes it: private helpers, implementation details, internal types. `detail` namespaces are a convention, not a mechanism.",
        "**A module is a compiled artefact, not text.** It is built once into a binary module interface, and importing it loads that — so the parse happens once, the order of imports does not matter, macros do not cross the boundary in either direction, and only what you `export` is visible.",
      ],
      examples: [
        {
          id: "a-real-module",
          title: "A module built and run with GCC 14",
          lang: "cpp",
          code: `// ── geometry.cppm : a module interface unit ──────────────────────
module;                        // global module fragment: #includes go HERE
#include <cmath>

export module geometry;        // the module declaration

// NOT exported: invisible to importers, even at namespace scope.
double squared(double x) { return x * x; }

export namespace geometry {

struct Point { double x, y; };

double distance(const Point& a, const Point& b) {
    return std::sqrt(squared(a.x - b.x) + squared(a.y - b.y));
}

double norm(const Point& p) { return distance({0, 0}, p); }

}   // namespace geometry


// ── main.cpp ─────────────────────────────────────────────────────
#include <iomanip>
#include <iostream>

import geometry;

int main() {
    geometry::Point a{0, 0}, b{3, 4};
    std::cout << std::fixed << std::setprecision(2);
    std::cout << "distance = " << geometry::distance(a, b) << '\\n';
    std::cout << "norm     = " << geometry::norm(b) << '\\n';

    // squared(2.0);   // ERROR: not exported, so not visible here
    std::cout << "squared() is not exported, so main cannot see it\\n";
}`,
          output: `$ g++ -std=c++20 -fmodules-ts -x c++ -c geometry.cppm -o geometry.o
$ g++ -std=c++20 -fmodules-ts main.cpp geometry.o -o prog
$ ./prog
distance = 5.00
norm     = 5.00
squared() is not exported, so main cannot see it

# Uncommenting the squared(2.0) line:
main.cpp:11:5: error: 'squared' was not declared in this scope`,
          explanation:
            "**`squared` is a non-static function at namespace scope in the module, and `main` cannot see it.** With a header that would be impossible — anything declared is visible to every includer, and privacy is a naming convention at best. This is genuine encapsulation at the translation-unit level, and it is arguably a bigger deal than the compile-time saving. Note `#include <cmath>` sits in the **global module fragment**, before `export module`: that is the only place includes are allowed in a module interface, and it is how modules interoperate with the header world.",
        },
      ],
      pitfalls: [
        {
          title: "GCC 14's module support is real but fragile about include order",
          body: "In building the example above, putting `#include <iomanip>` *after* `import geometry;` produced a wall of errors from deep inside `<type_traits>` about \"template definition of non-template\" — nothing to do with the module's own code. Moving the includes above the import fixed it. That is not standard-mandated behaviour; it is an implementation limitation, and it is representative of the state of module tooling. If you hit inexplicable errors in standard headers when experimenting with modules, try reordering the includes and imports before assuming your code is wrong.",
        },
      ],
    },
    {
      id: "structure",
      heading: "The pieces of a module",
      body: [
        "**A module interface unit** declares `export module name;` and defines what importers can see. There is exactly one per module.",
        "**A module implementation unit** declares `module name;` — no `export` — and holds definitions that do not need to be in the interface. It can see everything in the interface, exported or not, which is how you keep the interface small without a `detail` namespace.",
        "**`export`** marks what is visible. It can prefix a single declaration, or a `namespace` block, or appear as `export { ... }` around several. Everything else is internal to the module regardless of where it sits.",
        "**The global module fragment** — between `module;` and `export module name;` — is the only place `#include` may appear in an interface unit. It exists so a module can use header-based libraries.",
        "**The private module fragment** — `module : private;` — puts definitions after it that importers never depend on, so changing them does not force them to rebuild. It only works in a single-file module.",
        "**Partitions** split a large module: `export module geometry:shapes;` is a partition of `geometry`, imported internally as `import :shapes;` and re-exported with `export import :shapes;`. They keep one logical module manageable without exposing the split to consumers.",
        "**Header units** — `import <vector>;` — are the migration path, treating an existing header as an importable unit with no changes to it. Support is the weakest part of most implementations.",
      ],
      examples: [
        {
          id: "module-structure",
          title: "Interface, implementation and partitions",
          lang: "cpp",
          code: `// ── account.cppm : the interface ─────────────────────────────────
module;
#include <string>
#include <stdexcept>

export module account;

export class Account {
public:
    Account(std::string owner, long long cents);

    void deposit(long long cents);
    bool withdraw(long long cents);
    long long balance() const;
    const std::string& owner() const;

private:
    std::string owner_;
    long long   cents_;
};

// Not exported: importers cannot call it, but the implementation unit can.
void validate(long long cents);


// ── account.cpp : the implementation unit ────────────────────────
module account;                 // NOT 'export module'

void validate(long long cents) {
    if (cents < 0) throw std::invalid_argument("negative amount");
}

Account::Account(std::string owner, long long cents)
    : owner_(std::move(owner)), cents_(cents) { validate(cents); }

void Account::deposit(long long cents) { validate(cents); cents_ += cents; }

bool Account::withdraw(long long cents) {
    validate(cents);
    if (cents_ < cents) return false;
    cents_ -= cents;
    return true;
}

long long Account::balance() const { return cents_; }
const std::string& Account::owner() const { return owner_; }


// ── A partitioned module ─────────────────────────────────────────
// bank.cppm
//     export module bank;
//     export import :accounts;      // re-export the partition
//     export import :reporting;
//
// bank-accounts.cppm
//     export module bank:accounts;
//     export class Account { ... };
//
// bank-reporting.cppm
//     module bank:reporting;        // internal partition, not exported
//     import :accounts;             // partitions may import each other`,
          output: `# Consumers write one line and get the whole module:
#
#     import bank;
#
# They cannot import bank:accounts directly -- partitions are internal
# structure, not part of the public interface. That is the point.`,
          explanation:
            "**`validate` is declared in the interface but not exported, and defined in the implementation unit.** The implementation unit can see it because it belongs to the same module; importers cannot, because it was never exported. With headers this would require either a `detail` namespace that leaks anyway, or an anonymous namespace that gives you a separate copy per translation unit. Partitions solve the other half of the problem: a large module can be split across files without that split becoming part of what consumers see.",
        },
      ],
    },
    {
      id: "adoption",
      heading: "Should you use them yet",
      body: [
        "Modules were standardised in C++20 and adoption in 2026 is still limited. The honest position is that they are excellent for new code on a controlled toolchain and painful everywhere else.",
        "**Compiler support has arrived but is uneven.** MSVC is the most complete. Clang is solid from 17 onwards. GCC's `-fmodules-ts` works — the example above is a real GCC 14 build — but has rough edges, including the include-ordering problem noted above. `import std;`, standardised in C++23, is the piece that would make modules genuinely compelling and is the least widely available.",
        "**Build system support is the real blocker.** Modules require the build to know the *dependency graph between source files* before compiling, because a module must be compiled before anything importing it — which is a fundamental change from headers, where any file can be compiled in any order. CMake supports this from 3.28 with `CXX_MODULES` file sets, and it requires a recent generator. Anything older cannot express it.",
        "**Mixing modules and headers works but is where the sharp edges are.** Most real projects have to, since their dependencies are header-based.",
        "**The pragmatic advice**: if you are starting fresh, control your toolchain, and can require CMake 3.28+ with Ninja, modules are worth adopting. If you are maintaining an existing codebase, the migration cost is high and the tooling is still settling — revisit when `import std;` is universally available.",
        "**Meanwhile, the things that actually speed up header-based builds** are worth more today: forward declarations instead of includes, the pimpl idiom to cut header dependencies, precompiled headers for the stable third-party set, `ccache` for rebuilds, and `include-what-you-use` to delete includes nobody needs.",
      ],
      examples: [
        {
          id: "cmake-modules",
          title: "Modules in CMake 3.28+, and the practical alternatives",
          lang: "bash",
          code: `# ── CMake 3.28+ : modules as a FILE SET ───────────────────────────
cmake_minimum_required(VERSION 3.28)
project(geo LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_SCAN_FOR_MODULES ON)

add_library(geometry)
target_sources(geometry
    PUBLIC
        FILE_SET CXX_MODULES FILES        # <- the new file set type
            src/geometry.cppm
            src/geometry-shapes.cppm
    PRIVATE
        src/geometry_impl.cpp)

add_executable(demo src/main.cpp)
target_link_libraries(demo PRIVATE geometry)

# Requires a generator that supports dynamic dependency scanning:
#   cmake -S . -B build -G Ninja
# Makefiles cannot express "compile this file before that one is scanned".


# ── What to do TODAY on a header-based project ────────────────────

# 1. Precompiled headers for the stable third-party set.
target_precompile_headers(app PRIVATE
    <vector> <string> <memory> <unordered_map>
    <fmt/core.h>)

# 2. ccache, which usually helps more than anything else here.
find_program(CCACHE ccache)
if(CCACHE)
    set(CMAKE_CXX_COMPILER_LAUNCHER \${CCACHE})
endif()

# 3. Unity builds -- fewer translation units, so headers parse fewer times.
#    Genuinely effective and genuinely risky: it changes ODR and anonymous
#    namespace behaviour, so it can hide bugs. Use in CI, not as the default.
set_target_properties(app PROPERTIES
    UNITY_BUILD ON
    UNITY_BUILD_BATCH_SIZE 8)`,
          output: `# Built and run with CMake 4.4.2 + Ninja + GCC 14:
$ cmake -S . -B build -G Ninja && cmake --build build
[4/8] Generating CXX dyndep file CMakeFiles/demo.dir/CXX.dd
      ^ the dependency scan that makes modules work
[5/8] Building CXX object CMakeFiles/geometry.dir/src/geometry.cppm.o
[6/8] Linking CXX static library libgeometry.a
[7/8] Building CXX object CMakeFiles/demo.dir/src/main.cpp.o
[8/8] Linking CXX executable demo
$ ./build/demo
distance = 5.00
norm     = 5.00

# The SAME project with Unix Makefiles:
$ cmake -S . -B build-make -G "Unix Makefiles"
CMake Error in CMakeLists.txt:
  modules are not supported by this generator:
  details.  Use the CMAKE_CXX_SCAN_FOR_MODULES variable to enable or
  disable scanning.

# Measuring before optimising, on any project:
$ cmake -S . -B build -G Ninja -DCMAKE_CXX_FLAGS="-ftime-trace"   # Clang
$ ninja -C build -d stats           # where Ninja spent its time
$ include-what-you-use ...          # which includes are unnecessary`,
          explanation:
            "**The Ninja build works and the Makefiles build fails with `modules are not supported by this generator`** — the requirement is real, not a documentation caution. Note the `Generating CXX dyndep file` step: that is Ninja discovering the import graph *during* the build, which is precisely what a Makefile cannot express, since make needs its dependency graph fixed before it starts. The bottom half is the honest recommendation for existing projects — `ccache` and precompiled headers deliver most of the practical benefit today with none of the migration risk.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is wrong with `#include`?",
      answer:
        "It is textual substitution, so the entire header and everything it includes is pasted into every file that includes it, and reparsed each time — a project with 500 files including `<vector>` parses tens of thousands of lines 500 times. Include order matters and is invisible, since a header may compile only if another was included first. Macros leak in both directions: a macro defined before the include changes the header's meaning, and macros the header defines affect everything after, which is why `<windows.h>` defining `min` and `max` breaks `std::min`. And there is no encapsulation — everything declared is visible to every includer, with `detail` namespaces being a convention rather than a mechanism.",
    },
    {
      question: "What does a module change?",
      answer:
        "A module is compiled once into a binary module interface, and importing loads that rather than reparsing text. So the parse cost is paid once rather than per translation unit; import order does not matter; macros do not cross the boundary in either direction; and only what you explicitly `export` is visible, giving real encapsulation. A non-exported function at namespace scope inside a module is genuinely invisible to importers, which no header arrangement can achieve. The compile-time saving is the usual selling point, but the encapsulation and macro isolation are arguably more valuable.",
    },
    {
      question: "What is the global module fragment for?",
      answer:
        "It is the region between `module;` and `export module name;`, and it is the only place `#include` may appear in a module interface unit. It exists so modules can use header-based libraries, which is nearly all of them — you include `<cmath>` or a third-party header there, and its contents are attached to the global module rather than yours, so they are not exported to your importers. Without it, a module could not depend on any header, which would make modules unusable during the long period where most code is still header-based.",
    },
    {
      question: "What is the difference between a module interface unit and an implementation unit?",
      answer:
        "The interface unit declares `export module name;` and defines what importers see; there is exactly one per module. An implementation unit declares `module name;` with no `export`, and holds definitions that need not be in the interface. The important property is that an implementation unit can see everything in the interface, exported or not — so you can declare an internal helper in the interface, leave it unexported, and define it in the implementation unit. With headers that needs a `detail` namespace, which leaks, or an anonymous namespace, which gives a separate copy per translation unit.",
    },
    {
      question: "Why do modules require build system support that headers do not?",
      answer:
        "Because a module must be compiled before anything that imports it, so the build needs the dependency graph *between source files* before it starts — and that graph can only be discovered by scanning the sources for `import` declarations. With headers, any translation unit can be compiled in any order, which is why make-style builds work at all. CMake supports this from 3.28 via `FILE_SET CXX_MODULES`, and it requires a generator like Ninja that can handle dependencies discovered during the build; Makefiles cannot express it. This, rather than compiler support, is the main practical blocker to adoption.",
    },
    {
      question: "Should a project adopt modules in 2026?",
      answer:
        "Only if it is new, controls its toolchain, and can require CMake 3.28+ with Ninja. Compiler support has arrived but is uneven — MSVC is most complete, Clang solid from 17, GCC's `-fmodules-ts` works but has rough edges such as sensitivity to include-versus-import ordering. `import std;` from C++23, which is what would make modules genuinely compelling, is the least widely available piece. For an existing header-based codebase the migration cost is high and the tooling is still settling. The practical wins available today are `ccache`, precompiled headers for stable third-party includes, forward declarations, pimpl, and `include-what-you-use`.",
    },
  ],
  takeaways: [
    "`#include` is textual substitution, so every header is reparsed in every translation unit",
    "Include order matters invisibly, and macros leak in both directions",
    "Headers give no encapsulation — `detail` namespaces are a convention, not a mechanism",
    "A module is compiled once into a binary interface; importing loads it rather than reparsing",
    "Only `export`ed entities are visible; a plain namespace-scope function is genuinely hidden",
    "The global module fragment, before `export module`, is the only place `#include` may appear",
    "An implementation unit sees everything in the interface, exported or not",
    "Partitions split a large module without exposing the split to consumers",
    "The private module fragment stops importers rebuilding when definitions change",
    "Modules need the build to know the source-file dependency graph before compiling",
    "CMake supports them from 3.28 with `FILE_SET CXX_MODULES`, and needs Ninja",
    "GCC 14 works but is sensitive to whether includes precede imports",
    "Today, `ccache`, precompiled headers and include-what-you-use deliver more with less risk",
  ],
  status: "available",
};
