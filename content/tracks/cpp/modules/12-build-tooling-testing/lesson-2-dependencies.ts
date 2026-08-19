import type { Lesson } from "@/content/types";

export const dependenciesLesson: Lesson = {
  id: "cpp-dependencies",
  slug: "find-package-and-fetchcontent",
  moduleSlug: "build-tooling-testing",
  title: "Dependencies with find_package & FetchContent",
  summary:
    "The two ways CMake acquires a library, and when each is right. Config mode against the legacy module mode, `FetchContent` building a dependency from source as part of your build, and how to make a project work whether the dependency is installed or not.",
  estimatedMinutes: 35,
  objectives: [
    "Use `find_package` and distinguish config mode from module mode",
    "Read an imported target and explain why it is better than variables",
    "Use `FetchContent` to build a dependency from source",
    "Choose between finding, fetching and vendoring",
    "Write a project that works with either strategy",
  ],
  sections: [
    {
      id: "find-package",
      heading: "`find_package`, and its two modes",
      body: [
        "**`find_package(Foo REQUIRED)` locates an already-installed dependency.** It searches a list of prefixes — `CMAKE_PREFIX_PATH`, standard system locations, and environment hints — and, when it succeeds, defines *imported targets* you link against.",
        "**Config mode is the modern one.** The dependency itself ships a `FooConfig.cmake` (or `foo-config.cmake`), written by its authors and installed alongside its headers and libraries. It knows the library's real usage requirements: its include paths, its own transitive dependencies, whether it needs C++20. Anything installed by a package manager in the last decade provides this.",
        "**Module mode is the legacy fallback.** CMake ships `FindFoo.cmake` scripts for libraries that predate the convention — `FindThreads`, `FindOpenGL`, `FindPython`. These are written by the CMake project, not the library, so they guess: they search for headers and library files by name and set variables. Some modern ones do define imported targets; older ones just set `FOO_INCLUDE_DIRS` and `FOO_LIBRARIES`.",
        "**Prefer imported targets to variables, always.** `target_link_libraries(app PRIVATE Foo::Foo)` carries the include paths, transitive dependencies and compile features automatically. Using `${FOO_INCLUDE_DIRS}` and `${FOO_LIBRARIES}` by hand gets you the two things the variables name and silently loses everything else, which is how you end up with a link error mentioning a library you have never heard of.",
        "**The `Foo::Bar` namespace form is not cosmetic.** A name containing `::` is *guaranteed* by CMake to be a target, so a typo produces an immediate error at configure time. A bare `foo` that does not match a target is treated as a plain `-lfoo` on the link line and fails much later, with a worse message.",
      ],
      examples: [
        {
          id: "find-package-usage",
          title: "Finding dependencies, with components and version constraints",
          lang: "bash",
          code: `cmake_minimum_required(VERSION 3.21)
project(service LANGUAGES CXX)

# ── Config mode: the library ships its own FooConfig.cmake ────────
# REQUIRED  -> fail at configure time if missing, with a clear message
# CONFIG    -> do not fall back to module mode; fail honestly instead
find_package(fmt 10.0 REQUIRED CONFIG)

# COMPONENTS: only ask for the parts you use.
find_package(Boost 1.81 REQUIRED COMPONENTS program_options system)

# ── Module mode: CMake ships the finder for these ─────────────────
find_package(Threads REQUIRED)          # gives Threads::Threads
find_package(OpenSSL REQUIRED)          # gives OpenSSL::SSL, OpenSSL::Crypto

# ── Optional dependency, with a feature flag ──────────────────────
find_package(ZLIB QUIET)                # QUIET: no message if absent

add_executable(service src/main.cpp src/handler.cpp)

target_link_libraries(service PRIVATE
    fmt::fmt
    Boost::program_options
    OpenSSL::SSL
    Threads::Threads)

if(ZLIB_FOUND)
    target_link_libraries(service PRIVATE ZLIB::ZLIB)
    target_compile_definitions(service PRIVATE SERVICE_HAVE_ZLIB=1)
    message(STATUS "zlib found -- compression enabled")
else()
    message(STATUS "zlib not found -- compression disabled")
endif()

# ── Reporting what was found is worth the three lines ─────────────
message(STATUS "fmt      : \${fmt_VERSION}")
message(STATUS "Boost    : \${Boost_VERSION}")
message(STATUS "OpenSSL  : \${OPENSSL_VERSION}")`,
          output: `$ cmake -S . -B build
-- fmt      : 10.1.1
-- Boost    : 1.83.0
-- OpenSSL  : 3.0.11
-- zlib not found -- compression disabled
-- Configuring done
-- Generating done

# And when something is genuinely missing, REQUIRED fails immediately
# with an actionable message rather than a link error much later:

CMake Error at CMakeLists.txt:8 (find_package):
  Could not find a package configuration file provided by "fmt" (requested
  version 10.0) with any of the following names:

    fmtConfig.cmake
    fmt-config.cmake

  Add the installation prefix of "fmt" to CMAKE_PREFIX_PATH or set
  "fmt_DIR" to a directory containing one of the above files.`,
          explanation:
            "**`REQUIRED` failing at configure time with the names it looked for is the behaviour you want.** The error tells you exactly what to install and which variable to set, rather than surfacing as an undefined symbol after a five-minute compile. Note `CONFIG` on the `fmt` line: without it, a failed config-mode search silently falls back to module mode, and if some stale `Findfmt.cmake` exists you get a confusing half-configured build instead of a clean failure.",
        },
      ],
      pitfalls: [
        {
          title: "`find_package` finds what is installed, which is not necessarily what you tested against",
          body: "Two developers with different distributions get different versions of every system dependency, and CI gets a third. A version constraint like `find_package(fmt 10.0 REQUIRED)` means *at least* 10.0 by default, so a system with fmt 11 satisfies it and may behave differently. `EXACT` is available but usually too strict to be practical. This reproducibility gap is the entire reason `FetchContent` and the package managers in lesson 4 exist: they pin a specific version that everyone gets. For anything beyond a hobby project, pin your dependencies somewhere.",
        },
      ],
    },
    {
      id: "fetchcontent",
      heading: "`FetchContent`",
      body: [
        "**`FetchContent` downloads a dependency's source and adds it to your build as a subdirectory.** The dependency is compiled with your compiler, your flags and your standard, and its targets become available exactly as if you had written them yourself.",
        "The upside is reproducibility: **pin a git tag or, better, a commit hash, and every developer and every CI run gets identical source.** Nothing needs to be installed, so a fresh clone plus `cmake` is the whole setup.",
        "The downsides are real. **Build time**: the dependency is compiled from source on the first configure, and again whenever you clean. **Nested dependencies**: if two of your dependencies both fetch a third, you can end up with duplicate targets and a name clash. **Flag contamination**: the dependency is built with your flags, so your `-Werror` applies to their code, which is why you frequently need to suppress warnings for fetched sources.",
        "**`FetchContent_MakeAvailable` is the modern one-liner**, replacing the older `FetchContent_GetProperties` plus `if(NOT foo_POPULATED)` dance. Since CMake 3.24 it also integrates with `find_package` via `FIND_PACKAGE_ARGS`, which gives you the best of both: **use an installed copy if one exists, otherwise fetch it.**",
        "**Pin to a commit hash, not a tag or branch.** A tag can be moved, and `GIT_TAG main` means your build is not reproducible at all — a dependency changing upstream can break your build with no change on your side. `GIT_SHALLOW TRUE` makes the clone much faster, but only works with a branch or tag name, so there is a genuine trade against hash pinning.",
      ],
      examples: [
        {
          id: "fetchcontent-usage",
          title: "Fetching a test framework, and preferring an installed copy",
          lang: "bash",
          code: `cmake_minimum_required(VERSION 3.24)   # 3.24+ for FIND_PACKAGE_ARGS
project(app LANGUAGES CXX)

include(FetchContent)

# ── Pinned to a commit hash: fully reproducible ───────────────────
FetchContent_Declare(fmt
    GIT_REPOSITORY https://github.com/fmtlib/fmt.git
    GIT_TAG        e69e5f977d458f2650bb346dadf2ad30c5320281   # = tag 10.2.1
)

# ── Use the system copy if present, otherwise fetch ───────────────
# FIND_PACKAGE_ARGS makes MakeAvailable try find_package(Catch2 3) first.
FetchContent_Declare(Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG        v3.5.2
    GIT_SHALLOW    TRUE
    FIND_PACKAGE_ARGS 3 REQUIRED
)

# Turn off the dependency's own tests and docs BEFORE making it available,
# or you build their test suite as part of your project.
set(FMT_TEST     OFF CACHE BOOL "" FORCE)
set(FMT_DOC      OFF CACHE BOOL "" FORCE)
set(CATCH_INSTALL_DOCS OFF CACHE BOOL "" FORCE)

FetchContent_MakeAvailable(fmt Catch2)

add_executable(app src/main.cpp)
target_link_libraries(app PRIVATE fmt::fmt)

# ── Do not apply our warning policy to their code ─────────────────
# SYSTEM on the include directories silences warnings from their headers.
if(TARGET fmt)
    get_target_property(fmt_includes fmt INTERFACE_INCLUDE_DIRECTORIES)
    target_include_directories(app SYSTEM PRIVATE \${fmt_includes})
endif()

enable_testing()
add_executable(tests tests/money_test.cpp)
target_link_libraries(tests PRIVATE Catch2::Catch2WithMain fmt::fmt)

include(Catch)
catch_discover_tests(tests)`,
          output: `$ cmake -S . -B build
-- Populating fmt
-- Found Catch2: /usr/lib/cmake/Catch2  (found suitable version "3.5.2")
   ^ Catch2 was already installed, so it was NOT downloaded
-- Configuring done

$ cmake --build build -j
$ ctest --test-dir build --output-on-failure

# On a machine WITHOUT Catch2 installed, the same CMakeLists clones and
# builds it instead -- no change to the file, no instructions in the README.`,
          explanation:
            "**`FIND_PACKAGE_ARGS` is the line that makes this pleasant for everyone.** A developer with Catch2 already installed uses it and configures in a second; a fresh CI container downloads and builds it, with no branching in the CMakeLists and no \"first install these packages\" section in the README. Note the `set(... CACHE BOOL \"\" FORCE)` calls *before* `MakeAvailable` — a fetched dependency's own tests and documentation targets are built as part of your project unless you turn them off, which is a common and confusing source of slow builds.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Find, fetch, vendor or submodule",
      body: [
        "Four strategies, and the right answer depends on what you are building.",
        "**`find_package`** — when the dependency is large, widely packaged, and your users are expected to have a development environment: Qt, Boost, OpenSSL, system libraries. Fast configure, no build cost, and users get security updates from their distribution. The cost is that you cannot control the version.",
        "**`FetchContent`** — when the dependency is small to medium, you want a pinned version, and a fresh clone should just build. Ideal for test frameworks, header-only libraries and anything not reliably packaged. The cost is build time and flag contamination.",
        "**A package manager** — vcpkg or Conan, covered in lesson 4 — when you have many dependencies, need binary caching, or must reproduce builds exactly across platforms. This is the answer for most serious projects.",
        "**Vendoring or git submodules** — copying the source into your repository, or referencing it as a submodule. Maximum control and maximum maintenance: you own the merge conflicts and the security updates forever. Justifiable when you have patched the dependency, or when your build must work with no network at all.",
        "**A library you publish should default to `find_package` and let consumers override.** Forcing `FetchContent` on your users means they get *your* pinned version of a shared dependency, which conflicts the moment another library in the same build pins a different one. Fetching is a decision for the top-level application, not for a library in the middle.",
      ],
      examples: [
        {
          id: "installable",
          title: "Making your library findable by others",
          lang: "bash",
          code: `# ── Installing a library so consumers can find_package() it ───────
include(GNUInstallDirs)
include(CMakePackageConfigHelpers)

add_library(shapes src/circle.cpp)
add_library(shapes::shapes ALIAS shapes)

target_include_directories(shapes PUBLIC
    \$<BUILD_INTERFACE:\${CMAKE_CURRENT_SOURCE_DIR}/include>
    \$<INSTALL_INTERFACE:\${CMAKE_INSTALL_INCLUDEDIR}>)

# 1. Install the binaries, recording them in an export set.
install(TARGETS shapes
    EXPORT  shapesTargets
    LIBRARY DESTINATION \${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION \${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION \${CMAKE_INSTALL_BINDIR})

# 2. Install the headers.
install(DIRECTORY include/ DESTINATION \${CMAKE_INSTALL_INCLUDEDIR})

# 3. Install the export set -- this generates shapesTargets.cmake,
#    which recreates the imported targets WITH their usage requirements.
install(EXPORT shapesTargets
    FILE       shapesTargets.cmake
    NAMESPACE  shapes::
    DESTINATION \${CMAKE_INSTALL_LIBDIR}/cmake/shapes)

# 4. Generate a version file so find_package(shapes 1.2) works.
write_basic_package_version_file(
    "\${CMAKE_CURRENT_BINARY_DIR}/shapesConfigVersion.cmake"
    VERSION       \${PROJECT_VERSION}
    COMPATIBILITY SameMajorVersion)

# 5. Generate and install the Config file consumers actually find.
configure_package_config_file(
    "\${CMAKE_CURRENT_SOURCE_DIR}/cmake/shapesConfig.cmake.in"
    "\${CMAKE_CURRENT_BINARY_DIR}/shapesConfig.cmake"
    INSTALL_DESTINATION \${CMAKE_INSTALL_LIBDIR}/cmake/shapes)

install(FILES
    "\${CMAKE_CURRENT_BINARY_DIR}/shapesConfig.cmake"
    "\${CMAKE_CURRENT_BINARY_DIR}/shapesConfigVersion.cmake"
    DESTINATION \${CMAKE_INSTALL_LIBDIR}/cmake/shapes)


# ── cmake/shapesConfig.cmake.in ───────────────────────────────────
# @PACKAGE_INIT@
# include(CMakeFindDependencyMacro)
# find_dependency(fmt 10.0)        # OUR public dependencies, re-found
# include("\${CMAKE_CURRENT_LIST_DIR}/shapesTargets.cmake")
# check_required_components(shapes)`,
          output: `$ cmake --install build --prefix /usr/local

# A consumer now writes exactly this, and gets the include paths,
# the C++20 requirement and the transitive fmt dependency:

find_package(shapes 1.2 REQUIRED)
target_link_libraries(their_app PRIVATE shapes::shapes)`,
          explanation:
            "**Step 3 is the one people omit, and it is the one that matters.** Installing the *export set* generates a file that recreates your imported targets complete with their usage requirements — so a consumer linking `shapes::shapes` inherits the include directory and the C++20 requirement automatically. Installing only the headers and the `.a` gives consumers a library they must configure by hand. Note `find_dependency` rather than `find_package` in the config template: it propagates `REQUIRED` and `QUIET` correctly and fails the *consumer's* `find_package(shapes)` with a sensible message when a transitive dependency is missing.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between config mode and module mode in `find_package`?",
      answer:
        "Config mode uses a `FooConfig.cmake` shipped and installed *by the dependency itself*, so it knows the library's real usage requirements — include paths, transitive dependencies, required language standard — and defines imported targets. Module mode uses a `FindFoo.cmake` shipped *by CMake*, written for libraries that predate the convention, which searches for headers and library files by name and guesses. Config mode is preferred and is what any library packaged in the last decade provides. Passing `CONFIG` explicitly stops a failed config search from silently falling back to module mode, which otherwise produces a confusing half-configured build if a stale finder exists.",
    },
    {
      question: "Why prefer imported targets to the variables a finder sets?",
      answer:
        "Because an imported target like `Foo::Foo` carries the full set of usage requirements — include directories, transitive dependencies, compile features, compile definitions — and linking it applies all of them. The variables `FOO_INCLUDE_DIRS` and `FOO_LIBRARIES` carry exactly the two things they name, so using them by hand silently loses everything else, which typically surfaces as a link error mentioning a transitive library you have never heard of. The `::` in the name is also a guarantee: CMake requires a name containing `::` to be a target, so a typo fails at configure time, whereas a bare misspelled name becomes a plain `-lname` on the link line and fails much later.",
    },
    {
      question: "When would you use `FetchContent` rather than `find_package`?",
      answer:
        "When you want a pinned, reproducible version and a fresh clone to build with no prior installation — typical for test frameworks, header-only libraries and anything not reliably packaged by distributions. It downloads the source and builds it as part of your project, so everyone gets identical code. The costs are build time on first configure and after a clean, potential target name clashes when two dependencies fetch the same third one, and flag contamination — the dependency is built with your flags, so your `-Werror` applies to their code. Since CMake 3.24, `FIND_PACKAGE_ARGS` lets you get both: use an installed copy if present, fetch otherwise.",
    },
    {
      question: "Why should you pin `FetchContent` to a commit hash rather than a tag?",
      answer:
        "Because tags can be moved and branches change constantly. `GIT_TAG main` means your build is not reproducible at all — an upstream commit can break your build with no change on your side, and two developers cloning on different days get different code. A tag is better but is still a mutable reference in git; a commit hash is immutable and is the only fully reproducible option. The trade-off is that `GIT_SHALLOW TRUE`, which makes cloning dramatically faster, only works with a branch or tag name, so you choose between fast clones and exact pinning.",
    },
    {
      question: "Should a library you publish use `FetchContent` for its dependencies?",
      answer:
        "No — default to `find_package` and let the consumer decide. If your library fetches a pinned version of a shared dependency, every consumer gets *your* pin, and the build breaks as soon as another library in the same project pins a different version of the same thing. Fetching is a decision for the top-level application, which is the only place with the authority to resolve version conflicts. A published library should declare its dependencies with `find_package`, re-declare the public ones with `find_dependency` in its installed config file, and stay out of the version-selection business.",
    },
    {
      question: "What do you need to install for consumers to `find_package` your library?",
      answer:
        "Four things. The binaries, via `install(TARGETS ... EXPORT ...)`. The headers. The *export set*, via `install(EXPORT ...)`, which generates a targets file recreating your imported targets complete with usage requirements — this is the step people omit, and without it consumers get a library they must configure by hand. And a `FooConfig.cmake` plus a version file generated by `write_basic_package_version_file`, which is what `find_package` actually searches for. Inside the config file, use `find_dependency` rather than `find_package` for your public dependencies, so `REQUIRED` and `QUIET` propagate correctly.",
    },
  ],
  takeaways: [
    "`find_package` locates an installed dependency; config mode is modern, module mode is legacy",
    "Config files are written by the library; Find modules are written by CMake and guess",
    "Pass `CONFIG` to prevent a silent fallback to module mode",
    "Link imported targets like `Foo::Foo`, never raw `FOO_LIBRARIES` variables",
    "A name with `::` must be a target, so typos fail at configure time",
    "`FetchContent` downloads and builds a dependency as part of your project",
    "Pin to a commit hash — a tag is mutable and a branch is not reproducible at all",
    "Turn off the dependency's tests and docs before `FetchContent_MakeAvailable`",
    "`FIND_PACKAGE_ARGS` (CMake 3.24+) uses an installed copy if present, fetches otherwise",
    "A fetched dependency is built with your flags, so your `-Werror` hits their code",
    "Applications may fetch; published libraries should `find_package` and let consumers choose",
    "To be findable, install the targets, headers, **export set**, config and version file",
    "Use `find_dependency` inside your config file so `REQUIRED` propagates",
  ],
  status: "available",
};
