import type { Lesson } from "@/content/types";

export const codebaseStructureLesson: Lesson = {
  id: "cpp-codebase-structure",
  slug: "structuring-a-real-codebase",
  moduleSlug: "production-cpp",
  title: "Structuring a Real Codebase: Layering, Dependencies & Build Times",
  summary:
    "How a project stops being pleasant to work on, and what prevents it. Physical design as the thing that actually controls build times, the include graph as a dependency graph you can measure, and the layering rule that keeps a codebase changeable after year three.",
  estimatedMinutes: 40,
  objectives: [
    "Lay out a project so the structure states the architecture",
    "Distinguish logical from physical design and control the include graph",
    "Use forward declarations and pimpl to cut compile-time coupling",
    "Enforce layering so dependencies cannot go the wrong way",
    "Diagnose a slow build rather than guessing at it",
  ],
  sections: [
    {
      id: "layout",
      heading: "Layout, and what it should say",
      body: [
        "**The directory structure is the first architecture document anyone reads**, and it should say something true. A tree of `src/`, `utils/`, `helpers/` and `misc/` says there is no architecture.",
        "The layout that scales is **one directory per component, each with a public header directory and a private source directory**, and a build target per component. That makes the dependency graph explicit in the build system, where it can be enforced.",
        "**Public headers go in `include/<project>/<component>/`.** The nesting looks redundant and is not: it means consumers write `#include <myproj/net/socket.h>`, which cannot collide with another project's `socket.h` and tells a reader where the type comes from.",
        "**Private headers live beside the sources in `src/`** and are not installed. If a header is not part of your interface, do not publish it — every published header is something you cannot change.",
        "**Tests mirror the source tree.** `src/net/socket.cpp` pairs with `tests/net/socket_test.cpp`, so finding the tests for a file is mechanical.",
        "**One class per header is a reasonable default and not a rule.** Types that are meaningless apart — a `Result` and its `Error` enum — belong together. What matters is that a consumer including your header does not thereby depend on things they never use.",
      ],
      examples: [
        {
          id: "tree",
          title: "A layout that states the architecture",
          lang: "bash",
          code: `myproj/
├── CMakeLists.txt
├── CMakePresets.json          # so CI and developers build identically
├── vcpkg.json                 # or conanfile.txt
├── .clang-tidy .clang-format
│
├── include/myproj/            # PUBLIC headers only -- the interface
│   ├── core/                  #   layer 0: no dependencies
│   │   ├── result.h
│   │   └── logging.h
│   ├── net/                   #   layer 1: depends on core
│   │   ├── socket.h
│   │   └── http_client.h
│   └── app/                   #   layer 2: depends on net + core
│       └── service.h
│
├── src/                       # sources AND private headers
│   ├── core/
│   │   ├── logging.cpp
│   │   └── ring_buffer.h      #   private: never installed
│   ├── net/
│   │   ├── socket.cpp
│   │   └── tls_context.h      #   private
│   └── app/service.cpp
│
├── tests/                     # mirrors src/
│   ├── core/logging_test.cpp
│   ├── net/socket_test.cpp
│   └── app/service_test.cpp
│
├── apps/                      # the thin executables
│   └── serve/main.cpp
├── bench/                     # performance tests, separate from correctness
└── docs/adr/                  # architecture decision records


# ── CMakeLists.txt : the layering, enforced ───────────────────────
add_library(myproj_core src/core/logging.cpp)
target_include_directories(myproj_core
    PUBLIC  $<BUILD_INTERFACE:\${CMAKE_SOURCE_DIR}/include>
    PRIVATE \${CMAKE_SOURCE_DIR}/src)
# core links NOTHING from this project -- that is what layer 0 means.

add_library(myproj_net src/net/socket.cpp)
target_include_directories(myproj_net
    PUBLIC  $<BUILD_INTERFACE:\${CMAKE_SOURCE_DIR}/include>
    PRIVATE \${CMAKE_SOURCE_DIR}/src)
target_link_libraries(myproj_net PUBLIC myproj_core)

add_library(myproj_app src/app/service.cpp)
target_link_libraries(myproj_app PUBLIC myproj_net)

add_executable(serve apps/serve/main.cpp)
target_link_libraries(serve PRIVATE myproj_app)

# myproj_core cannot include <myproj/net/socket.h> and link: there is no
# edge from core to net, so it would not compile. The build system is
# where layering is ENFORCED rather than documented.`,
          output: `# Two properties worth the effort:
#
#   1. The include path is the component path, so
#        #include <myproj/net/socket.h>
#      tells a reader exactly which component owns the type.
#
#   2. A dependency in the wrong direction fails to LINK, because the
#      target graph has no edge for it. Layering enforced by a comment
#      is layering that will be violated.`,
          explanation:
            "**The important line is the one that is absent: `myproj_core` links nothing.** Layer 0 means no dependencies on the rest of the project, and because the layering lives in `target_link_libraries` rather than in a README, a call from `core` into `net` fails to build. Note the `PRIVATE src/` include directory on each target — that is what lets a component's own sources include its private headers while consumers cannot.",
        },
      ],
      pitfalls: [
        {
          title: "A `utils` or `common` library becomes the dependency sink",
          body: "Every codebase grows one, and it fails the same way: anything with no obvious home goes in, so `common` ends up depending on the network layer, the database layer and the config layer, and now *everything* depends on all of them transitively. The build gets slow, layering is gone, and the library cannot be reused because it drags the whole project along. The fixes are to name components by what they *are* rather than by what they are not — `strings`, `time`, `logging` — to keep the lowest layer genuinely dependency-free, and to notice that a utility needing another component is not a utility.",
        },
      ],
    },
    {
      id: "physical-design",
      heading: "Physical design and build times",
      body: [
        "**Logical design is which class depends on which. Physical design is which *file* depends on which** — and only the second determines your build time.",
        "**Every `#include` in a header is a dependency you impose on everyone who includes you**, transitively. Module 12 lesson 3 covered the mechanism: the preprocessor pastes the text, so a header including `<vector>` costs every one of its consumers that parse.",
        "The techniques, in order of how much they buy:",
        "**Forward declare instead of including.** A header needs a full definition only for a base class, a by-value member, or anything whose size or members it uses. **A pointer, a reference, or a function parameter or return type only needs a declaration.**",
        "**Move includes to the `.cpp`.** If only the implementation needs it, that is where it belongs — this is the single highest-value habit and it costs nothing.",
        "**Pimpl** hides a class's members entirely behind a `unique_ptr` to an incomplete type, so its header includes nothing its interface does not need and its consumers do not recompile when its members change. The costs are real: an allocation per object and an indirection per access, so it suits large, rarely-instantiated, frequently-changed classes at library boundaries — not `Point`.",
        "**Interfaces break dependencies both ways.** An abstract base in a low layer, implemented in a high one, is how a component calls code that depends on it without depending back — dependency inversion, which module 9 lesson 4 introduced for testing and which is equally a build-time tool.",
      ],
      examples: [
        {
          id: "pimpl",
          title: "Forward declaration and pimpl, with what each buys",
          lang: "cpp",
          code: `// ═══ include/myproj/net/http_client.h ═══════════════════════════
#pragma once
#include <memory>          // for unique_ptr
#include <string>          // in the interface, unavoidable
#include <string_view>

// Forward declarations: no include needed, because we only use
// references and return values here.
namespace myproj::core { class Logger; }

namespace myproj::net {

class Response;            // returned by value? no -- see below

class HttpClient {
public:
    // The header does NOT include <openssl/ssl.h>, <asio.hpp>,
    // <unordered_map> or anything else the implementation needs.
    explicit HttpClient(core::Logger& log);
    ~HttpClient();                              // must be OUT OF LINE

    HttpClient(HttpClient&&) noexcept;
    HttpClient& operator=(HttpClient&&) noexcept;
    HttpClient(const HttpClient&)            = delete;
    HttpClient& operator=(const HttpClient&) = delete;

    std::string get(std::string_view url);
    void setHeader(std::string_view name, std::string_view value);

private:
    struct Impl;                                // incomplete here
    std::unique_ptr<Impl> impl_;
};

}   // namespace myproj::net


// ═══ src/net/http_client.cpp ════════════════════════════════════
#include <myproj/net/http_client.h>

// ALL the heavy includes live here, where they cost one TU.
#include <myproj/core/logging.h>
#include <unordered_map>
#include <vector>
// #include <openssl/ssl.h>
// #include <asio.hpp>

namespace myproj::net {

struct HttpClient::Impl {
    core::Logger*                                log;
    std::unordered_map<std::string, std::string> headers;
    std::vector<char>                            buffer;
    int                                          retries = 3;
    // Adding a member here recompiles ONE file, not every consumer.
};

HttpClient::HttpClient(core::Logger& log)
    : impl_{std::make_unique<Impl>()} { impl_->log = &log; }

// Defined here, where Impl is complete. This is the part people miss.
HttpClient::~HttpClient() = default;
HttpClient::HttpClient(HttpClient&&) noexcept = default;
HttpClient& HttpClient::operator=(HttpClient&&) noexcept = default;

void HttpClient::setHeader(std::string_view n, std::string_view v) {
    impl_->headers.emplace(n, v);
}

std::string HttpClient::get(std::string_view url) {
    return "GET " + std::string{url} + " with "
         + std::to_string(impl_->headers.size()) + " headers";
}

}   // namespace myproj::net`,
          output: `# What the header costs its consumers:
#
#   without pimpl : <unordered_map>, <vector>, <openssl/ssl.h>, <asio.hpp>
#                   -- parsed in EVERY translation unit that includes it,
#                   and every consumer recompiles when a member changes
#
#   with pimpl    : <memory>, <string>, <string_view>
#                   -- and adding a member to Impl recompiles ONE file

# The compiler-generated destructor is the classic trap. Remove the
# '~HttpClient();' declaration and a CONSUMER fails to compile:
#
#   /usr/include/c++/14/bits/unique_ptr.h:91:23: error: invalid
#   application of 'sizeof' to incomplete type 'HttpClient::Impl'
#      91 |         static_assert(sizeof(_Tp)>0,
#
# libstdc++ catches it with a static_assert; other implementations
# have historically compiled it and produced undefined behaviour.
# Declare the destructor and moves in the header, define them
# '= default' in the .cpp, and the pattern works.`,
          explanation:
            "**The out-of-line destructor is the detail that makes or breaks pimpl.** If you do not declare it, the compiler generates one in the header, where `Impl` is incomplete — and `unique_ptr`'s deleter then tries to `delete` an incomplete type, which is undefined behaviour that GCC and Clang usually catch with a `static_assert` but MSVC historically did not. The same applies to the move operations. Declare all of them, define them `= default` in the `.cpp`, and the pattern works.",
        },
      ],
    },
    {
      id: "measuring",
      heading: "Measuring the build",
      body: [
        "**Build time is a productivity input, and it is measurable rather than a matter of opinion.** A ten-minute build changes how people work: they batch changes, they stop running tests locally, they context-switch while waiting.",
        "**Find out where it goes before acting.** `-ftime-report` (GCC) and `-ftime-trace` (Clang) break down a single translation unit; the Clang version emits a JSON trace you can open in `chrome://tracing` and see exactly which header cost what. `ninja -d stats` and `ninja -t graph` show the build-level picture.",
        "**The usual culprits, in the order they usually appear.** A header included everywhere that pulls in half the standard library. Heavy templates instantiated in many TUs. Everything depending on one central header, so any change rebuilds the world. And missing forward declarations.",
        "**The fixes worth trying first cost nothing structural.** `ccache` reuses object files across rebuilds and branch switches. Precompiled headers for the stable third-party set. A unity build merges TUs so shared headers parse once — genuinely effective, and genuinely risky, since it changes ODR and anonymous-namespace behaviour and can hide bugs, so it belongs in CI rather than as the default.",
        "**`include-what-you-use` deletes includes nobody needs**, which is the structural fix and the one that keeps paying.",
        "**And measure the incremental build, not the clean one.** Clean builds happen in CI; developers pay the cost of changing one file and rebuilding, and that number is dominated by how many things include the file they touched.",
      ],
      examples: [
        {
          id: "build-measurement",
          title: "Finding the expensive header",
          lang: "bash",
          code: `# ── Which headers cost what, in one TU ───────────────────────────
$ clang++ -std=c++20 -ftime-trace -c src/app/service.cpp
$ python3 -c "
import json,collections
d=json.load(open('service.json'))
t=collections.Counter()
for e in d['traceEvents']:
    if e.get('name')=='Source' and 'detail' in e.get('args',{}):
        t[e['args']['detail']] += e['dur']
for name,us in t.most_common(8):
    print(f'{us/1000:8.1f} ms  {name}')
"
#   412.7 ms  /usr/include/c++/14/regex          <- 0.4s, in every TU
#   188.3 ms  /usr/include/c++/14/format
#    96.1 ms  include/myproj/app/service.h
#    41.2 ms  /usr/include/c++/14/vector

# GCC's equivalent, less detailed:
$ g++ -ftime-report -c src/app/service.cpp


# ── Which files does a change rebuild? ───────────────────────────
$ ninja -t query src/core/logging.cpp | head
$ ninja -t graph | dot -Tsvg > deps.svg

# The number that matters: touch a header, see how much rebuilds.
$ touch include/myproj/core/result.h && ninja -n | wc -l
#   347       <- 347 targets rebuild for one low-level header


# ── Delete includes nobody needs ─────────────────────────────────
$ include-what-you-use -Xiwyu --mapping_file=... -std=c++20 src/net/socket.cpp
#   socket.cpp should remove these lines:
#   - #include <algorithm>  // lines 4-4
#   - #include <sstream>    // lines 7-7


# ── Cheap wins, in order ─────────────────────────────────────────
find_program(CCACHE ccache)
if(CCACHE)
  set(CMAKE_CXX_COMPILER_LAUNCHER \${CCACHE})   # biggest win, zero risk
endif()

target_precompile_headers(myproj_core PRIVATE
    <string> <vector> <memory> <unordered_map>)

# Unity builds: effective, and they change ODR/anon-namespace behaviour.
# Use in CI to catch what they break, not as the default.
set_target_properties(myproj_app PROPERTIES
    UNITY_BUILD ON UNITY_BUILD_BATCH_SIZE 8)`,
          output: `# The diagnostic that decides what to do:
#
#   touch a header -> how many targets rebuild?
#     a few          -> physical design is fine
#     hundreds       -> that header is a hub; break it up or
#                       forward-declare your way out of it
#
# And the ordering of fixes:
#   1. ccache                      (zero risk, large win, five minutes)
#   2. move includes to the .cpp   (zero risk, permanent)
#   3. forward declarations        (zero risk, permanent)
#   4. precompiled headers         (low risk)
#   5. pimpl at library boundaries (real design cost)
#   6. unity builds                (real correctness risk -- CI only)`,
          explanation:
            "**`touch a header && ninja -n | wc -l` is the single most useful build diagnostic**, because it measures what developers actually pay: the cost of changing one file. A low-level header that rebuilds 347 targets is the thing to fix, and no amount of `ccache` addresses it — the caching helps when nothing changed, and this is the case where something did. Note the fix ordering: `ccache` first because it is five minutes and no risk, unity builds last because they can hide real bugs.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How should a C++ project be laid out?",
      answer:
        "One directory per component, each with public headers under `include/<project>/<component>/` and sources plus private headers under `src/<component>/`, with a build target per component. The nested include path means consumers write `#include <myproj/net/socket.h>`, which cannot collide with another project's header and tells a reader which component owns the type. Private headers live beside the sources and are never installed, because every published header is something you can no longer change freely. Tests mirror the source tree so finding a file's tests is mechanical, and thin executables live in `apps/` so the logic stays in libraries where it can be tested.",
    },
    {
      question: "What is the difference between logical and physical design?",
      answer:
        "Logical design is which class depends on which; physical design is which *file* depends on which — and only the second determines build time. Because `#include` is textual substitution, every include in a header is a dependency imposed transitively on everyone who includes it, so a header pulling in `<regex>` costs every consumer that parse. Two classes can be logically independent while their headers are physically coupled, and that coupling is what makes builds slow and changes expensive. The tools for fixing it are forward declarations, moving includes into the `.cpp`, pimpl, and interfaces.",
    },
    {
      question: "When can you forward declare instead of including?",
      answer:
        "Whenever you do not need the type's definition: a pointer or reference member, a function parameter or return type, and a `unique_ptr` or `shared_ptr` member — though a `unique_ptr` member requires the destructor to be declared and defined out of line. You need the full definition for a base class, a by-value member, anything whose size you use, anything you call a member on, and any template instantiated with it where the definition is required. The habit worth forming is that a header includes only what its *interface* needs, and everything else moves to the `.cpp`.",
    },
    {
      question: "What is pimpl, what does it buy, and what does it cost?",
      answer:
        "Hiding a class's members behind a `unique_ptr` to an incomplete `Impl` type, so the header includes only what the interface needs and consumers do not recompile when the members change. It also gives a stable ABI, since the object's size never changes. The costs are a heap allocation per object and an indirection per member access, plus loss of inlining across the boundary — so it suits large, rarely-instantiated, frequently-changed classes at library boundaries, not small value types. The critical detail is that the destructor and move operations must be *declared* in the header and *defined* in the `.cpp` where `Impl` is complete; otherwise the compiler generates them in the header and `unique_ptr` deletes an incomplete type.",
    },
    {
      question: "Why do `utils` and `common` libraries fail?",
      answer:
        "Because they are defined by what they are not, so anything without an obvious home goes in. Over time `common` acquires dependencies on the network, database and config layers, and since everything depends on `common`, everything now depends on all of them transitively. The build slows, layering is gone, and the library cannot be reused elsewhere because it drags the whole project with it. The fixes are naming components for what they *are* — `strings`, `time`, `logging` — keeping the lowest layer genuinely dependency-free, and treating a utility that needs another component as evidence it is not a utility.",
    },
    {
      question: "How would you diagnose a slow build?",
      answer:
        "Measure before acting. `clang++ -ftime-trace` emits a per-translation-unit JSON trace showing exactly which headers cost what, viewable in `chrome://tracing`; GCC has `-ftime-report`. At the project level, `ninja -d stats` and `ninja -t graph` show the shape. The single most useful number is what developers actually pay: touch a header and count how many targets rebuild — `touch header.h && ninja -n | wc -l`. A low-level header rebuilding hundreds of targets is a hub to break up. Then apply fixes in risk order: `ccache` first, moving includes to `.cpp` files, forward declarations, precompiled headers, pimpl at boundaries, and unity builds last because they can hide ODR bugs.",
    },
  ],
  takeaways: [
    "The directory structure is the first architecture document — make it say something true",
    "One component per directory, public headers in `include/<project>/<component>/`",
    "Private headers live beside the sources and are never installed",
    "Put layering in `target_link_libraries` so a wrong-direction dependency fails to build",
    "Logical design is class-to-class; physical design is file-to-file and sets your build time",
    "Every include in a header is imposed transitively on every consumer",
    "Forward declare for pointers, references, parameters and return types",
    "Move any include only the implementation needs into the `.cpp`",
    "Pimpl hides members and stabilises ABI, at one allocation and one indirection per object",
    "Pimpl requires the destructor and moves declared in the header and defined in the `.cpp`",
    "`utils`/`common` becomes a dependency sink — name components for what they are",
    "`touch a header && ninja -n | wc -l` is the build diagnostic that matters",
    "Fix in risk order: ccache, includes, forward declarations, PCH, pimpl, unity builds",
  ],
  status: "available",
};
