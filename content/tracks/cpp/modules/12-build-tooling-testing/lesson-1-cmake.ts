import type { Lesson } from "@/content/types";

export const cmakeLesson: Lesson = {
  id: "cpp-cmake",
  slug: "cmake-targets-properties-and-usage-requirements",
  moduleSlug: "build-tooling-testing",
  title: "CMake from First Principles: Targets, Properties & Usage Requirements",
  summary:
    "Modern CMake as it is actually written: everything is a target, targets carry properties, and properties propagate to whoever links them. The `PUBLIC`/`PRIVATE`/`INTERFACE` distinction that decides what your consumers inherit, and the directory-scoped commands you should never use again.",
  estimatedMinutes: 40,
  objectives: [
    "Write a CMakeLists.txt using targets rather than global settings",
    "Explain what `PUBLIC`, `PRIVATE` and `INTERFACE` mean on `target_*` commands",
    "Say why `include_directories` and `add_definitions` are obsolete",
    "Structure a multi-target project with a library and an executable",
    "Use presets and out-of-source builds",
  ],
  sections: [
    {
      id: "targets",
      heading: "Everything is a target",
      body: [
        "CMake as written before roughly 2014 was a pile of global variables: `include_directories` applied to everything below the current directory, `add_definitions` set macros for the whole project, `CMAKE_CXX_FLAGS` was a string you appended to and hoped. It worked for one program and fell apart the moment a project had two components with different requirements.",
        "**Modern CMake is target-based.** A target is a library or an executable, it carries its own properties, and those properties **propagate to anything that links it**. There are no global settings to get wrong, because there are no global settings.",
        "The commands you use are all `target_`-prefixed: **`target_link_libraries`**, **`target_include_directories`**, **`target_compile_definitions`**, **`target_compile_features`**, **`target_compile_options`**, **`target_sources`**.",
        "**Their directory-scoped equivalents — `include_directories`, `add_definitions`, `link_libraries`, and appending to `CMAKE_CXX_FLAGS` — should be treated as removed from the language.** They apply to every target in the directory and below, including ones added later by someone who has no idea, and they cannot express \"this is mine\" versus \"this is my consumers'\".",
        "**`target_link_libraries` does far more than pass `-l` flags.** It is the mechanism by which include directories, macro definitions, compile features and options flow from a dependency to its consumer. Linking a target means inheriting its usage requirements, which is the whole idea.",
      ],
      examples: [
        {
          id: "minimal",
          title: "A library and an executable, done properly",
          lang: "bash",
          code: `# ── CMakeLists.txt ────────────────────────────────────────────────
cmake_minimum_required(VERSION 3.21)

project(shapes
    VERSION      1.2.0
    DESCRIPTION  "A small geometry library and a demo"
    LANGUAGES    CXX)

# Sensible defaults, set BEFORE any target is created.
set(CMAKE_CXX_STANDARD          20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)   # 20 or fail -- do not silently fall back
set(CMAKE_CXX_EXTENSIONS        OFF)  # -std=c++20, not -std=gnu++20

# Put binaries somewhere predictable.
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY \${CMAKE_BINARY_DIR}/bin)

# ── The library ───────────────────────────────────────────────────
add_library(shapes
    src/circle.cpp
    src/rectangle.cpp)

# PUBLIC: consumers need this include path too, because our headers
# reference it. PRIVATE would keep it to ourselves.
target_include_directories(shapes
    PUBLIC  \$<BUILD_INTERFACE:\${CMAKE_CURRENT_SOURCE_DIR}/include>
            \$<INSTALL_INTERFACE:include>
    PRIVATE \${CMAKE_CURRENT_SOURCE_DIR}/src)

# PUBLIC: our headers use C++20 features, so consumers need it as well.
target_compile_features(shapes PUBLIC cxx_std_20)

# PRIVATE: warnings are our business, not our consumers'.
target_compile_options(shapes PRIVATE
    \$<\$<CXX_COMPILER_ID:GNU,Clang>:-Wall -Wextra -Wpedantic>
    \$<\$<CXX_COMPILER_ID:MSVC>:/W4>)

# An ALIAS so in-tree use looks exactly like installed use.
add_library(shapes::shapes ALIAS shapes)

# ── The executable ────────────────────────────────────────────────
add_executable(demo src/main.cpp)

# This one line gives 'demo' the include path, the C++20 requirement,
# and the link -- everything shapes declared PUBLIC.
target_link_libraries(demo PRIVATE shapes::shapes)`,
          output: `$ cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
$ cmake --build build -j
$ ./build/bin/demo

# Note: -S source -B build is the out-of-source form. Never run cmake
# inside the source tree -- it scatters generated files through your
# repository and there is no clean way to undo it.`,
          explanation:
            "**`target_link_libraries(demo PRIVATE shapes::shapes)` is doing five things at once.** It links the library, adds `include/` to `demo`'s include path, requires C++20 for `demo`, and would carry any `PUBLIC` definitions or options too — all because `shapes` declared them as usage requirements rather than setting them globally. The `-Wall` line is `PRIVATE`, so `demo` does not inherit the library's warning settings, which is correct: a consumer should not be forced into your warning policy.",
        },
      ],
      pitfalls: [
        {
          title: "`CMAKE_CXX_STANDARD` without `CMAKE_CXX_STANDARD_REQUIRED` silently downgrades",
          body: "By default `CMAKE_CXX_STANDARD 20` is a *preference*: if the compiler does not support C++20, CMake quietly falls back to whatever it does support and the build fails later with confusing errors about missing features. Setting `CMAKE_CXX_STANDARD_REQUIRED ON` turns that into a hard error at configure time, which is what you want. Also set `CMAKE_CXX_EXTENSIONS OFF` unless you deliberately want GNU extensions — the default is ON, which gives you `-std=gnu++20` and lets non-portable code compile without complaint.",
        },
      ],
    },
    {
      id: "propagation",
      heading: "PUBLIC, PRIVATE and INTERFACE",
      body: [
        "These three keywords appear on every `target_*` command and are the single most important thing to understand about modern CMake. They answer: **does this property apply when building me, when building my consumers, or both?**",
        "**`PRIVATE`** — used to build this target, not propagated. For implementation details: a `.cpp`-only dependency, warning flags, macros only the implementation reads.",
        "**`INTERFACE`** — *not* used to build this target, but propagated to consumers. For things your headers require that your sources do not, and the only option for a header-only library, which has nothing to build.",
        "**`PUBLIC`** — both. Used to build this target *and* propagated. For anything your public headers reference.",
        "**The test is simple: does my header mention it?** If `shapes/circle.h` does `#include <fmt/core.h>`, then fmt is `PUBLIC` — any consumer including your header needs fmt's include path too. If only `circle.cpp` includes it, it is `PRIVATE`.",
        "**Getting this wrong is the most common CMake bug in real projects.** Marking a dependency `PRIVATE` when your headers need it produces \"file not found\" for your consumers, which people then \"fix\" by adding a global `include_directories` somewhere — reintroducing exactly the problem targets solved. Marking everything `PUBLIC` works but leaks your implementation details into every consumer's compile line, slowing builds and creating dependencies nobody asked for.",
      ],
      examples: [
        {
          id: "propagation-example",
          title: "The three keywords, and how to choose",
          lang: "bash",
          code: `# ── Deciding by asking "does my HEADER need it?" ─────────────────

add_library(engine src/engine.cpp src/physics.cpp)

# include/engine/engine.h does  #include <nlohmann/json.hpp>
#   -> consumers including our header need it too      -> PUBLIC
target_link_libraries(engine PUBLIC nlohmann_json::nlohmann_json)

# only src/physics.cpp includes Eigen; no header mentions it
#   -> purely an implementation detail                 -> PRIVATE
target_link_libraries(engine PRIVATE Eigen3::Eigen)

# our headers are C++20; consumers must compile as C++20 as well
target_compile_features(engine PUBLIC cxx_std_20)

# warnings are our policy, not our consumers'
target_compile_options(engine PRIVATE -Wall -Wextra)

# ENGINE_BUILDING affects only our own translation units
target_compile_definitions(engine
    PRIVATE ENGINE_BUILDING=1
    PUBLIC  ENGINE_VERSION_MAJOR=1)   # our header reads this


# ── A header-only library: everything is INTERFACE ────────────────
# There is nothing to compile, so nothing can be PRIVATE or PUBLIC.

add_library(tiny_util INTERFACE)

target_include_directories(tiny_util INTERFACE
    \$<BUILD_INTERFACE:\${CMAKE_CURRENT_SOURCE_DIR}/include>
    \$<INSTALL_INTERFACE:include>)

target_compile_features(tiny_util INTERFACE cxx_std_20)

add_library(tiny::util ALIAS tiny_util)


# ── Consuming both ────────────────────────────────────────────────
add_executable(game src/main.cpp)
target_link_libraries(game PRIVATE engine tiny::util)
# game now has: nlohmann_json's headers (engine PUBLIC),
#               ENGINE_VERSION_MAJOR, C++20, tiny_util's headers.
# game does NOT have: Eigen, -Wall, ENGINE_BUILDING.`,
          output: `# The decision procedure, in one question:
#
#   Does my PUBLIC HEADER mention it?
#     yes, and my .cpp needs it too  -> PUBLIC
#     yes, but I have no .cpp at all -> INTERFACE
#     no, only my .cpp uses it       -> PRIVATE`,
          explanation:
            "**The `game` target inherited exactly what it needed and nothing else.** It can include engine headers that pull in nlohmann/json, because that was `PUBLIC`; it knows nothing about Eigen, because that was `PRIVATE` and is genuinely an implementation detail. Note `tiny_util` is an `INTERFACE` library with no sources — there is nothing to build, so every property must be `INTERFACE`, and that is the correct shape for any header-only library.",
        },
      ],
    },
    {
      id: "generator-expressions",
      heading: "Generator expressions and build types",
      body: [
        "**A generator expression, `$<...>`, is evaluated at build-system generation time rather than when the line is read.** That is what lets one `CMakeLists.txt` say different things for different configurations, compilers and platforms — which matters because multi-config generators like Visual Studio and Ninja Multi-Config decide Debug versus Release *after* CMake has run, so a plain `if(CMAKE_BUILD_TYPE STREQUAL Debug)` is simply wrong there.",
        "The forms worth knowing: **`$<CONFIG:Debug>`** for build type, **`$<CXX_COMPILER_ID:GNU,Clang>`** for compiler, **`$<PLATFORM_ID:Windows>`** for platform, and **`$<BUILD_INTERFACE:...>`/`$<INSTALL_INTERFACE:...>`** for paths that differ between the build tree and an installed package.",
        "**The build types** are `Debug` (no optimisation, debug info), `Release` (optimised, `NDEBUG` defined so assertions vanish), `RelWithDebInfo` (optimised *with* debug info — the right choice for profiling and for production binaries you want stack traces from), and `MinSizeRel`.",
        "**`CMAKE_BUILD_TYPE` is empty by default**, which means no optimisation flags at all — not Debug, just nothing. A project that does not set it or require it produces unoptimised binaries for people who forget the flag, and \"CMake made my code slow\" is almost always this.",
        "**Presets replace the wall of `-D` flags.** `CMakePresets.json` names configurations so `cmake --preset release` is the whole command, and — importantly — CI and developers then use provably identical settings.",
      ],
      examples: [
        {
          id: "presets",
          title: "Generator expressions, and a preset file",
          lang: "bash",
          code: `# ── Config- and compiler-dependent settings, done correctly ──────

target_compile_options(engine PRIVATE
    # per-compiler warnings
    \$<\$<CXX_COMPILER_ID:GNU,Clang>:-Wall -Wextra -Wpedantic>
    \$<\$<CXX_COMPILER_ID:MSVC>:/W4 /permissive->
    # extra checks in Debug only
    \$<\$<CONFIG:Debug>:-fno-omit-frame-pointer>)

target_compile_definitions(engine PRIVATE
    \$<\$<CONFIG:Debug>:ENGINE_ASSERTIONS=1>)

# A sanitizer option, off by default, wired to a real flag.
option(ENGINE_SANITIZE "Build with ASan and UBSan" OFF)
if(ENGINE_SANITIZE)
    target_compile_options(engine PRIVATE -fsanitize=address,undefined -g)
    target_link_options   (engine PRIVATE -fsanitize=address,undefined)
endif()


# ── CMakePresets.json ─────────────────────────────────────────────
{
  "version": 3,
  "configurePresets": [
    {
      "name": "base",
      "hidden": true,
      "generator": "Ninja",
      "binaryDir": "\${sourceDir}/build/\${presetName}",
      "cacheVariables": {
        "CMAKE_CXX_STANDARD": "20",
        "CMAKE_CXX_STANDARD_REQUIRED": "ON",
        "CMAKE_CXX_EXTENSIONS": "OFF",
        "CMAKE_EXPORT_COMPILE_COMMANDS": "ON"
      }
    },
    {
      "name": "debug",
      "inherits": "base",
      "cacheVariables": { "CMAKE_BUILD_TYPE": "Debug" }
    },
    {
      "name": "release",
      "inherits": "base",
      "cacheVariables": { "CMAKE_BUILD_TYPE": "RelWithDebInfo" }
    },
    {
      "name": "asan",
      "inherits": "debug",
      "cacheVariables": { "ENGINE_SANITIZE": "ON" }
    }
  ],
  "buildPresets": [
    { "name": "debug",   "configurePreset": "debug" },
    { "name": "release", "configurePreset": "release" },
    { "name": "asan",    "configurePreset": "asan" }
  ]
}`,
          output: `$ cmake --preset release
$ cmake --build --preset release

$ cmake --preset asan
$ cmake --build --preset asan
$ ./build/asan/bin/tests          # sanitizers enabled, no flag juggling

# CMAKE_EXPORT_COMPILE_COMMANDS writes build/<preset>/compile_commands.json,
# which is what clangd, clang-tidy and every editor's C++ support consume.
# Symlink it to the project root and your editor works with no configuration.`,
          explanation:
            "**Presets exist so that \"works on my machine\" stops being about build flags.** CI runs `cmake --preset release` and so do you, from the same checked-in file, so a difference in behaviour cannot come from a `-D` somebody forgot. `CMAKE_EXPORT_COMPILE_COMMANDS` is worth turning on unconditionally: it produces the `compile_commands.json` that clangd, clang-tidy and every modern editor need to know how your files are compiled.",
        },
      ],
      pitfalls: [
        {
          title: "`file(GLOB)` for source files is a trap CMake itself warns about",
          body: "`file(GLOB SOURCES src/*.cpp)` looks convenient and breaks incremental builds: CMake evaluates it at *configure* time, so adding a new file does not trigger reconfiguration and the file is silently not compiled until someone runs CMake again by hand. The failure is confusing — a symbol is undefined despite the source obviously existing. `CONFIGURE_DEPENDS` makes the glob re-run on each build, at the cost of a directory scan every time, and the documentation still recommends against it. **List your sources explicitly.** It is a few lines of maintenance and it makes the build reproducible and reviewable in diffs.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does \"modern CMake\" mean?",
      answer:
        "Target-based rather than directory-based. Everything is a target — a library or executable — which carries its own properties, and those properties propagate to whatever links it. You use `target_link_libraries`, `target_include_directories`, `target_compile_definitions` and so on, and you never use their directory-scoped equivalents like `include_directories` or `add_definitions`, which apply to every target in the directory and below, including ones added later, and cannot distinguish \"this is for building me\" from \"this is for my consumers\". `target_link_libraries` is the central mechanism: linking a target means inheriting its usage requirements, not merely passing a `-l` flag.",
    },
    {
      question: "What is the difference between PUBLIC, PRIVATE and INTERFACE?",
      answer:
        "They control propagation. `PRIVATE` means the property is used to build this target and not passed on — implementation-only dependencies, warning flags, internal macros. `INTERFACE` means it is not used to build this target but is passed to consumers — the only option for a header-only library, which has nothing to build. `PUBLIC` means both. The deciding question is whether your public headers mention the thing: if a header includes it, consumers need it too, so `PUBLIC`; if only a `.cpp` uses it, `PRIVATE`. Getting it wrong is the commonest CMake bug — too private and consumers fail to compile, too public and you leak implementation details into everyone's compile line.",
    },
    {
      question: "Why should you avoid `file(GLOB)` for source lists?",
      answer:
        "Because it is evaluated at configure time, not build time. Adding a new source file does not change any CMake input, so the build system is not regenerated and the file is silently never compiled — producing an undefined symbol for code that visibly exists, which is a confusing failure. `CONFIGURE_DEPENDS` makes the glob re-check on every build at the cost of a directory scan, and the CMake documentation still advises against relying on it. Listing sources explicitly is a small maintenance cost that makes the build reproducible and makes file additions visible in code review.",
    },
    {
      question: "What is a generator expression and why are they necessary?",
      answer:
        "A `$<...>` expression evaluated at build-system generation time rather than when the line is parsed, letting one `CMakeLists.txt` express per-configuration, per-compiler and per-platform differences. They are necessary because multi-config generators — Visual Studio, Ninja Multi-Config, Xcode — choose Debug or Release *after* CMake has run, so `if(CMAKE_BUILD_TYPE STREQUAL \"Debug\")` is simply wrong there: the variable is empty at configure time. `$<$<CONFIG:Debug>:...>` works in both single- and multi-config generators. They are also how `$<BUILD_INTERFACE:...>` and `$<INSTALL_INTERFACE:...>` express include paths that differ between the build tree and an installed package.",
    },
    {
      question: "What happens if `CMAKE_BUILD_TYPE` is not set?",
      answer:
        "You get no optimisation flags at all — not a Debug build, just nothing, so the compiler defaults to `-O0` with no debug info. Binaries are unoptimised and often several times slower, which is the usual explanation for \"CMake made my code slow\". Single-config generators like Makefiles and plain Ninja leave it empty by default; multi-config generators ignore it entirely and use `CMAKE_CONFIGURATION_TYPES` instead. The fix is to set a default in the project when it is empty, or better, to use presets so nobody configures without one. Note `RelWithDebInfo` is usually the right production choice, since it is optimised but still produces usable stack traces.",
    },
  ],
  takeaways: [
    "Modern CMake is target-based: properties live on targets and propagate to consumers",
    "Never use `include_directories`, `add_definitions`, or append to `CMAKE_CXX_FLAGS`",
    "`target_link_libraries` propagates includes, definitions, features and options — not just `-l`",
    "`PRIVATE`: build me only. `INTERFACE`: consumers only. `PUBLIC`: both",
    "The test is whether your public header mentions it",
    "A header-only library is an `INTERFACE` library and everything on it is `INTERFACE`",
    "Set `CMAKE_CXX_STANDARD_REQUIRED ON` or the standard is only a preference",
    "Set `CMAKE_CXX_EXTENSIONS OFF` or you get `-std=gnu++20` and non-portable code compiles",
    "Generator expressions are needed because multi-config generators pick the config after CMake runs",
    "An unset `CMAKE_BUILD_TYPE` means no optimisation flags at all",
    "`RelWithDebInfo` is usually right for production — optimised with usable stack traces",
    "Presets check the flags into the repository so CI and developers build identically",
    "Turn on `CMAKE_EXPORT_COMPILE_COMMANDS` — clangd and clang-tidy require it",
    "Do not `file(GLOB)` sources: new files are silently not compiled until you reconfigure",
  ],
  status: "available",
};
