import type { Lesson } from "@/content/types";

export const packageManagersLesson: Lesson = {
  id: "cpp-package-managers",
  slug: "package-management-with-vcpkg-and-conan",
  moduleSlug: "build-tooling-testing",
  title: "Package Management with vcpkg & Conan",
  summary:
    "Why C++ took thirty years to get a package manager, and what the two serious answers actually do. Manifest mode, binary caching, and the ABI compatibility problem that makes this harder than it is in every other language.",
  estimatedMinutes: 35,
  objectives: [
    "Explain why C++ package management is harder than npm or cargo",
    "Use vcpkg in manifest mode with a CMake toolchain file",
    "Use Conan with a profile and a `conanfile.txt`",
    "Explain binary caching and why it matters",
    "Choose between the two, or neither",
  ],
  sections: [
    {
      id: "why-hard",
      heading: "Why this is hard in C++",
      body: [
        "Every other mainstream language solved dependencies years ago. C++ took until roughly 2017 to have anything credible, and the reasons are real rather than cultural.",
        "**There is no ABI standard.** A library compiled with GCC 13 and libstdc++ may not link against code compiled with Clang and libc++, or with MSVC at all. Debug and release runtimes are incompatible on Windows. Change `_GLIBCXX_USE_CXX11_ABI` and a `std::string` in one object file is a different type from a `std::string` in another. **So a prebuilt binary is only usable by a build that matches it in compiler, standard library, standard version, and several flags** — which is why \"just download the `.so`\" does not work.",
        "**There is no standard build system.** A package manager has to drive CMake, Autotools, Meson, bare Makefiles and bespoke scripts, and produce something consumable from any of them.",
        "**There is no canonical package registry**, no `package.json` equivalent in the language, and no agreed installation layout across platforms.",
        "**Headers are part of the interface**, so a dependency's flags can affect your compilation — a macro it defines, a standard it requires — in ways a compiled-language linker never has to consider.",
        "**The consequence: C++ package managers build from source by default**, and cache the results keyed by a hash of everything that affects compatibility. That is what both vcpkg and Conan are doing underneath, and why the first build is slow and subsequent ones are not.",
      ],
      examples: [
        {
          id: "abi-problem",
          title: "The ABI problem, made concrete",
          lang: "bash",
          code: `# Why you cannot simply ship a prebuilt C++ library.

# 1. Standard library implementation
g++  -stdlib=libstdc++   # GCC's, default on Linux
clang++ -stdlib=libc++   # LLVM's -- std::string is a DIFFERENT TYPE
#    Mixing them: undefined symbols mentioning std::__1::basic_string

# 2. The libstdc++ dual ABI, still with us since GCC 5
-D_GLIBCXX_USE_CXX11_ABI=1   # std::__cxx11::basic_string
-D_GLIBCXX_USE_CXX11_ABI=0   # the old COW string
#    Mixing them: link errors about std::__cxx11::basic_string

# 3. MSVC debug vs release runtimes
/MDd   # debug DLL runtime
/MD    # release DLL runtime
#    Mixing them: heap corruption at runtime, not a link error

# 4. Standard version can change class layout
-std=c++17   # std::string_view exists; some types differ
-std=c++20   # ...and some ABI-affecting changes with it

# 5. Anything that changes struct layout or inlining assumptions
-D NDEBUG            # can change class contents in some libraries
-fno-exceptions      # different function signatures entirely
-fvisibility=hidden  # different exported symbol sets


# The package manager's answer: build from source, and key the binary
# cache on a hash of ALL of the above.

$ vcpkg install fmt
# Computing installation plan...
# Detecting compiler hash for triplet x64-linux...
#   ^ this hash is the whole point`,
          output: `# The practical rule:
#   A C++ binary artefact is only reusable by a build that matches it in
#   compiler, standard library, standard version, and ABI-affecting flags.
#
# Every other language ships bytecode or has a stable ABI.
# C++ ships machine code with a compiler-specific object model.`,
          explanation:
            "**\"Detecting compiler hash\" is the line that explains C++ package management.** vcpkg fingerprints your toolchain and uses it as part of the cache key, so a binary built with GCC 13 is never handed to a Clang build. This is also why the same dependency may be built several times on one machine for different configurations, and why a correctly keyed shared team cache is worth setting up: the first developer pays the build cost and nobody else does.",
        },
      ],
    },
    {
      id: "vcpkg",
      heading: "vcpkg",
      body: [
        "**Microsoft's, but fully cross-platform and CMake-first.** The model that matters is **manifest mode**: a `vcpkg.json` next to your `CMakeLists.txt` declares your dependencies, and they are installed into the build tree rather than globally.",
        "Integration is a single **toolchain file**. Pass `-DCMAKE_TOOLCHAIN_FILE=.../vcpkg.cmake` and every `find_package` in your project transparently finds vcpkg's packages first. **Your `CMakeLists.txt` does not mention vcpkg at all**, which means the project still builds for someone using system packages instead.",
        "**Triplets** name the target configuration — `x64-linux`, `x64-windows`, `x64-windows-static`, `arm64-osx` — and control static versus dynamic linking and the CRT choice on Windows.",
        "**Versioning is baseline-driven.** `builtin-baseline` pins a commit of the vcpkg registry, which fixes the version of every dependency; `overrides` pin individual packages to exact versions. This is genuinely reproducible, and it is the part people skip.",
        "**Binary caching is the feature that makes it usable**, and it is on by default in `~/.cache/vcpkg/archives`. Set `VCPKG_BINARY_SOURCES` to point at a shared directory, a NuGet feed or object storage and the cache is shared across a team and CI. Measured below: a dependency that took 18 seconds to build was restored in 57 milliseconds by the next project on the same machine.",
        "**Strengths**: trivial CMake integration, large curated catalogue, excellent on Windows. **Weaknesses**: one version per baseline, so two dependencies needing different versions of a third is awkward; and the registry is a git repository you update wholesale.",
      ],
      examples: [
        {
          id: "vcpkg-manifest",
          title: "Manifest mode, pinned and cached",
          lang: "bash",
          code: `# ── vcpkg.json ────────────────────────────────────────────────────
{
  "name": "my-service",
  "version": "1.0.0",
  "dependencies": [
    "fmt",
    "spdlog",
    { "name": "boost-program-options", "version>=": "1.83.0" },
    { "name": "grpc", "platform": "!osx" }
  ],
  "features": {
    "tests": {
      "description": "Build the test suite",
      "dependencies": [ "catch2" ]
    }
  },
  "builtin-baseline": "a42af01b72c28a8e1d7b48107b33e4f286a55ef6",
  "overrides": [
    { "name": "fmt", "version": "10.1.1" }
  ]
}


# ── CMakeLists.txt : no mention of vcpkg anywhere ────────────────
cmake_minimum_required(VERSION 3.21)
project(my-service LANGUAGES CXX)

find_package(fmt CONFIG REQUIRED)
find_package(spdlog CONFIG REQUIRED)
find_package(Boost REQUIRED COMPONENTS program_options)

add_executable(service src/main.cpp)
target_link_libraries(service PRIVATE
    fmt::fmt spdlog::spdlog Boost::program_options)


# ── Building ──────────────────────────────────────────────────────
$ cmake -S . -B build \\
    -DCMAKE_TOOLCHAIN_FILE=$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake
$ cmake --build build

# With the test feature:
$ cmake -S . -B build -DVCPKG_MANIFEST_FEATURES=tests \\
    -DCMAKE_TOOLCHAIN_FILE=$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake


# ── Binary caching : the difference between minutes and seconds ──
$ export VCPKG_BINARY_SOURCES="clear;files,/shared/vcpkg-cache,readwrite"

# In CI, backed by object storage:
$ export VCPKG_BINARY_SOURCES="clear;x-azblob,https://...,readwrite"`,
          output: `# Measured on one machine, with only 'fmt' as a dependency.

# COLD -- binary cache empty:
Detecting compiler hash for triplet x64-linux...
Restored 0 package(s) from ~/.cache/vcpkg/archives in 12.1 us
Installing 3/3 fmt:x64-linux...
Building fmt:x64-linux...
Elapsed time to handle fmt:x64-linux: 18 s
                                       -> 23 s wall for the whole configure

# WARM -- a DIFFERENT project, same dependency and toolchain:
Restored 3 package(s) from ~/.cache/vcpkg/archives in 57.2 ms
Elapsed time to handle fmt:x64-linux: 1.86 ms
                                       -> 5 s wall for the whole configure

# fmt is small. A realistic dependency set -- Boost, gRPC, Qt -- turns
# the cold number into minutes or tens of minutes, while the warm number
# stays in the low seconds. That gap is why caching is worth configuring.`,
          explanation:
            "**The `CMakeLists.txt` contains no vcpkg-specific line.** That is the design goal: the toolchain file redirects `find_package`, so the same project builds against vcpkg, against system packages, or against a Conan-generated toolchain, with no edits. `builtin-baseline` is what makes it reproducible — without it you get whatever versions the registry has today. And note the cache is keyed on the *compiler hash* detected on the first line, which is why a second project on the same machine restored in 57 milliseconds what took 18 seconds to build.",
        },
      ],
    },
    {
      id: "conan",
      heading: "Conan",
      body: [
        "**Conan is build-system agnostic and more explicit about configuration.** Where vcpkg assumes CMake and hides itself, Conan generates files you point your build at and expects you to describe your environment.",
        "**Profiles are the central idea.** A profile names the compiler, version, standard library, C++ standard, build type and architecture, and it is a checked-in file. `--profile:host=./profiles/linux-gcc13` makes the whole configuration explicit and reviewable, which is a real advantage for cross-compilation, where host and build profiles differ.",
        "**Dependencies go in a `conanfile.txt`** for simple cases or a `conanfile.py` when you need logic — conditional dependencies, options, or packaging your own library.",
        "**Conan resolves version conflicts.** If two dependencies need different versions of a third, Conan has explicit rules and can be told how to resolve it. vcpkg's baseline model largely cannot express this, and it is the clearest functional difference between them.",
        "**Conan Center** is the public registry, and hosting a private one is a first-class supported workflow — which matters for companies with internal libraries.",
        "**Strengths**: works with any build system, explicit and reproducible configuration, real conflict resolution, good private-registry story. **Weaknesses**: more concepts to learn, more configuration to write, and the Conan 1 to 2 migration split the ecosystem for a while.",
      ],
      examples: [
        {
          id: "conan-usage",
          title: "A profile, a conanfile, and the generated toolchain",
          lang: "bash",
          code: `# ── profiles/linux-gcc13 : checked into the repository ────────────
[settings]
os=Linux
arch=x86_64
compiler=gcc
compiler.version=13
compiler.libcxx=libstdc++11
compiler.cppstd=20
build_type=Release

[conf]
tools.cmake.cmaketoolchain:generator=Ninja


# ── conanfile.txt ─────────────────────────────────────────────────
[requires]
fmt/10.1.1
spdlog/1.12.0
boost/1.83.0

[test_requires]
catch2/3.5.2

[generators]
CMakeDeps
CMakeToolchain

[options]
boost/*:shared=False
boost/*:without_python=True


# ── CMakeLists.txt : again, no mention of Conan ──────────────────
find_package(fmt REQUIRED)
find_package(spdlog REQUIRED)
add_executable(service src/main.cpp)
target_link_libraries(service PRIVATE fmt::fmt spdlog::spdlog)


# ── Building ──────────────────────────────────────────────────────
$ conan install . \\
      --profile:host=./profiles/linux-gcc13 \\
      --build=missing \\
      --output-folder=build

$ cmake -S . -B build \\
      -DCMAKE_TOOLCHAIN_FILE=build/conan_toolchain.cmake
$ cmake --build build


# ── A conanfile.py, when you need logic ───────────────────────────
from conan import ConanFile

class ServiceRecipe(ConanFile):
    settings  = "os", "compiler", "build_type", "arch"
    generators = "CMakeDeps", "CMakeToolchain"
    options   = {"with_grpc": [True, False]}
    default_options = {"with_grpc": False}

    def requirements(self):
        self.requires("fmt/10.1.1")
        self.requires("spdlog/1.12.0")
        if self.options.with_grpc:
            self.requires("grpc/1.54.3")

    def build_requirements(self):
        self.test_requires("catch2/3.5.2")`,
          output: `# --build=missing means: use a cached binary if one matches this
# profile exactly, otherwise build from source and cache the result.

$ conan install . --profile:host=./profiles/linux-gcc13 --build=missing
Requirements
    boost/1.83.0#a1b2c3 - Cache
    fmt/10.1.1#d4e5f6   - Download (conancenter)
    spdlog/1.12.0#78..  - Build

# The '#a1b2c3' is the package revision -- a hash of the recipe AND the
# configuration, which is Conan's answer to the ABI problem.`,
          explanation:
            "**The profile is the piece worth copying even if you never use Conan.** It makes \"what exactly are we building with\" a reviewable file rather than an accumulation of environment variables, and it is what allows the same command to produce identical results on a laptop and in CI. Note that the `CMakeLists.txt` is again untouched — both tools converged on generating a toolchain file precisely so projects do not become tied to one of them.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing",
      body: [
        "**Use vcpkg** if you are CMake-based, want the simplest possible integration, and are happy with one version set per baseline. It is the lowest-friction option and especially strong on Windows.",
        "**Use Conan** if you need multiple versions of the same dependency resolved, are not on CMake, need serious cross-compilation support, or want a private registry with your own packages.",
        "**Use `FetchContent`** — from lesson 2 — if you have a handful of dependencies and want no extra tooling. This is a perfectly respectable answer for small projects and is often the right one.",
        "**Use system packages** if you are shipping into a distribution that will handle dependencies for you, or targeting one controlled platform.",
        "**Whichever you choose, three things matter more than the choice.** **Pin your versions** — a baseline, a lockfile, or explicit pins — or your build is not reproducible and \"works on my machine\" becomes unanswerable. **Set up binary caching**, which even for one small dependency turned an 18-second build into a 57-millisecond restore, and which compounds across a team. **Keep the package manager out of your `CMakeLists.txt`**, so the project can still be built another way; both tools support this and it is worth preserving.",
        "**And do not underestimate the cost of a dependency.** Each one is build time, a supply-chain risk, a licence obligation, an ABI constraint and a thing that can break. For a hundred lines of functionality, writing it is often cheaper over the project's life than acquiring it.",
      ],
      examples: [
        {
          id: "comparison",
          title: "The four strategies, side by side",
          lang: "bash",
          code: `# ─────────────────────────────────────────────────────────────────
#                  vcpkg        Conan        FetchContent   system
# ─────────────────────────────────────────────────────────────────
# integration      toolchain    toolchain    in CMakeLists  find_package
#                  file         file
# build systems    CMake-first  any          CMake only     any
# version pinning  baseline     lockfile     git hash       none
# multiple ver-    no           yes          no             no
#   sions of one
#   dependency
# binary cache     yes          yes          no             n/a
# private registry limited      first-class  n/a            n/a
# extra tooling    yes          yes          NO             no
# first build      slow         slow         slow           instant
# cached build     seconds      seconds      still slow     instant
# ─────────────────────────────────────────────────────────────────

# The decision, in order:
#
#   < 5 dependencies, CMake, small team     -> FetchContent
#   CMake, want a catalogue, Windows or mix -> vcpkg
#   non-CMake, cross-compiling, or need
#     conflicting versions resolved         -> Conan
#   shipping into a distro                  -> system packages
#
# And regardless of the answer:
#   1. pin the versions
#   2. configure a binary cache
#   3. keep the tool out of CMakeLists.txt`,
          output: `# The question to ask before adding any dependency at all:
#
#   Would writing this myself take longer than
#     the build time, plus the supply-chain review,
#     plus the licence check, plus the ABI constraint,
#     plus the upgrade treadmill, over the project's life?
#
# For a hundred lines of functionality, usually not.`,
          explanation:
            "**The `extra tooling: NO` row is why `FetchContent` remains the right answer for a lot of projects.** A package manager is itself a dependency — something to install, version, teach, and debug in CI — and it only pays for itself past a certain number of libraries. The three rules at the bottom matter more than the column you pick: an unpinned vcpkg build is less reproducible than a `FetchContent` pinned to a commit hash.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is package management harder in C++ than in most languages?",
      answer:
        "Mainly the absence of a stable ABI. A library built with GCC and libstdc++ may not link against Clang with libc++; MSVC debug and release runtimes are incompatible; the libstdc++ dual ABI makes `std::string` two different types depending on a macro. So a prebuilt binary is only usable by a build matching it in compiler, standard library, standard version and several flags — which is why \"just download the .so\" does not work. Add the lack of a standard build system, no canonical registry, and the fact that headers are part of the interface, and the result is that C++ package managers build from source and cache the results keyed on a hash of everything affecting compatibility.",
    },
    {
      question: "How does vcpkg's manifest mode work?",
      answer:
        "A `vcpkg.json` beside your `CMakeLists.txt` declares dependencies, which are installed into the build tree rather than globally, so different projects cannot interfere. Integration is one toolchain file passed as `CMAKE_TOOLCHAIN_FILE`, which makes every `find_package` in your project find vcpkg's packages first — your `CMakeLists.txt` never mentions vcpkg, so the project still builds against system packages if someone prefers. `builtin-baseline` pins a registry commit and therefore every dependency version, and `overrides` pin individual packages exactly. Triplets like `x64-windows-static` select the target configuration.",
    },
    {
      question: "What does Conan do differently from vcpkg?",
      answer:
        "It is build-system agnostic rather than CMake-first, and explicit rather than implicit about configuration. Profiles are checked-in files naming compiler, version, standard library, C++ standard and build type, which makes \"what are we building with\" reviewable and makes cross-compilation natural since host and build profiles differ. Conan also resolves version conflicts: if two dependencies need different versions of a third, it has rules for that, which vcpkg's single-baseline model largely cannot express. And private registries are a first-class workflow rather than an add-on. The cost is more concepts and more configuration.",
    },
    {
      question: "What is binary caching and why does it matter so much in C++?",
      answer:
        "Because C++ package managers build from source, the first build of a dependency set can take minutes. A binary cache stores the compiled result keyed on a hash of everything affecting ABI compatibility — compiler, version, standard library, flags, the recipe itself — so any build with a matching configuration restores rather than rebuilds. Measured with a single small dependency, the build took 18 seconds and the restore 57 milliseconds; for a realistic set including Boost or gRPC the cold figure is minutes to tens of minutes while the warm one stays in the low seconds. Both vcpkg and Conan support local directories, network shares and object storage as cache backends. It is the single highest-value thing to configure after pinning versions.",
    },
    {
      question: "When would you not use a package manager at all?",
      answer:
        "When you have only a handful of dependencies, in which case `FetchContent` pinned to commit hashes gives reproducibility with no extra tooling to install, version, teach or debug in CI. Also when shipping into a Linux distribution that will supply dependencies, or targeting a single controlled platform where system packages suffice. A package manager is itself a dependency and pays for itself only past a certain scale. Regardless of the choice, three things matter more than which tool: pin the versions, configure a binary cache, and keep the tool out of `CMakeLists.txt` so the project can be built another way.",
    },
  ],
  takeaways: [
    "C++ has no stable ABI, so a prebuilt binary is only usable by a matching build",
    "Compiler, standard library, standard version, and flags like `_GLIBCXX_USE_CXX11_ABI` all matter",
    "So C++ package managers build from source and cache keyed on a compiler hash",
    "vcpkg manifest mode: `vcpkg.json` plus a toolchain file, with no vcpkg in your CMakeLists",
    "`builtin-baseline` pins every dependency version — without it the build is not reproducible",
    "Triplets select target configuration, including static linking and the Windows CRT",
    "Conan is build-system agnostic, with checked-in profiles making configuration explicit",
    "Conan resolves conflicting versions of a shared dependency; vcpkg's baseline model cannot",
    "Binary caching turned an 18-second dependency build into a 57-millisecond restore",
    "`FetchContent` remains right for a handful of dependencies — no extra tooling at all",
    "Whatever you choose: pin versions, cache binaries, keep the tool out of `CMakeLists.txt`",
    "Every dependency costs build time, supply-chain risk, a licence and an ABI constraint",
  ],
  status: "available",
};
