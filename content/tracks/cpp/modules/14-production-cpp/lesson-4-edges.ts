import type { Lesson } from "@/content/types";

export const edgesLesson: Lesson = {
  id: "cpp-edges",
  slug: "filesystem-processes-and-networking",
  moduleSlug: "production-cpp",
  title: "Filesystem, Processes & Networking at the Edges of a Program",
  summary:
    "Where a program meets the operating system, and where most production bugs live. `<filesystem>`'s dual API, the atomic write that prevents a half-written config, why every path is a TOCTOU race, and the RAII wrappers that make OS handles safe.",
  estimatedMinutes: 40,
  objectives: [
    "Use `<filesystem>` and choose between its throwing and error-code forms",
    "Write a file atomically so a reader never sees it half-written",
    "Explain TOCTOU and structure filesystem code to avoid it",
    "Wrap OS handles in RAII types",
    "Handle partial reads and writes on a socket correctly",
  ],
  sections: [
    {
      id: "filesystem",
      heading: "`<filesystem>`",
      body: [
        "**Every `<filesystem>` operation comes in two forms**: one that throws `std::filesystem_error`, and one taking a `std::error_code&` that reports failure without throwing. Module 10 lesson 5 covered why — a missing file is sometimes exceptional and sometimes entirely expected, and the library refuses to decide for you.",
        "**Use the error-code form for anything you expect to fail** — checking whether a file exists, opening an optional config — and the throwing form when failure means the operation cannot continue.",
        "**`fs::path` is not a string.** It handles separators, has `stem`, `extension`, `parent_path` and `filename`, composes with `operator/`, and knows the platform's conventions. Building paths with string concatenation is how you get `//` on Linux and broken paths on Windows.",
        "**Prefer the query functions that return rather than throw.** `fs::exists(p, ec)` and `fs::is_directory(p, ec)` do not throw on a permission error the way the throwing forms do.",
        "**Note what `file_size` returns on failure**: `static_cast<uintmax_t>(-1)`, which prints as 18446744073709551615. **The return value is meaningless when `ec` is set**, which is exactly the out-parameter staleness problem module 10 described — check `ec`, never the value.",
        "**Directory iteration**: `fs::directory_iterator` for one level, `fs::recursive_directory_iterator` for a tree, both with error-code overloads. Both can throw mid-iteration if a directory becomes unreadable, so the error-code form matters for anything traversing paths you do not control.",
      ],
      examples: [
        {
          id: "fs-example",
          title: "Atomic write, the non-throwing API, and a subprocess",
          lang: "cpp",
          code: `#include <cstdio>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <memory>
#include <string>
#include <system_error>

namespace fs = std::filesystem;

// Atomic write: write a temp file in the SAME directory, then rename.
// rename() is atomic on POSIX, so a concurrent reader sees either the
// old contents or the new -- never a partial file.
bool writeAtomically(const fs::path& target, std::string_view contents,
                     std::error_code& ec) {
    fs::path tmp = target;
    tmp += ".tmp";
    {
        std::ofstream out{tmp, std::ios::binary | std::ios::trunc};
        if (!out) { ec = std::make_error_code(std::errc::io_error); return false; }
        out.write(contents.data(), static_cast<std::streamsize>(contents.size()));
        out.flush();
        if (!out) { ec = std::make_error_code(std::errc::io_error); return false; }
    }
    fs::rename(tmp, target, ec);        // same filesystem, so this is atomic
    return !ec;
}

// RAII for a process pipe. Same shape as module 9's FILE* wrapper.
struct PipeCloser { void operator()(std::FILE* f) const { if (f) ::pclose(f); } };
using Pipe = std::unique_ptr<std::FILE, PipeCloser>;

std::string runCommand(const std::string& cmd, int& exitCode) {
    Pipe p{::popen(cmd.c_str(), "r")};
    if (!p) { exitCode = -1; return {}; }
    std::string out;
    char buf[256];
    while (std::fgets(buf, sizeof(buf), p.get())) out += buf;
    exitCode = ::pclose(p.release()) / 256;
    return out;
}

int main() {
    fs::path dir = fs::temp_directory_path() / "cpp14_edges";
    std::error_code ec;
    fs::create_directories(dir, ec);
    std::cout << "working dir: " << dir << "\\n";

    fs::path f = dir / "config.txt";     // operator/ , not string concatenation
    if (writeAtomically(f, "port=8080\\nworkers=4\\n", ec))
        std::cout << "atomic write ok, size = " << fs::file_size(f) << " bytes\\n";
    else
        std::cout << "write failed: " << ec.message() << "\\n";

    // The non-throwing API. NOTE the return value on failure.
    auto missing = fs::file_size(dir / "nope.txt", ec);
    std::cout << "file_size on a missing file: " << (ec ? ec.message() : "??")
              << " (returned " << missing << ")\\n";

    std::cout << "exists  : " << fs::exists(f) << "\\n";
    std::cout << "is_dir  : " << fs::is_directory(dir) << "\\n";
    std::cout << "stem    : " << f.stem().string()
              << ", ext: " << f.extension().string() << "\\n";

    int rc = 0;
    std::string out = runCommand("printf 'a\\\\nb\\\\nc\\\\n' | wc -l", rc);
    std::cout << "subprocess exit=" << rc << " output=" << out;

    fs::remove_all(dir, ec);
    std::cout << "cleaned up\\n";
}`,
          output: `working dir: "/tmp/cpp14_edges"
atomic write ok, size = 20 bytes
file_size on a missing file: No such file or directory (returned 18446744073709551615)
exists  : 1
is_dir  : 1
stem    : config, ext: .txt
subprocess exit=0 output=3
cleaned up`,
          explanation:
            "**`file_size` returned 18446744073709551615 — that is `uintmax_t(-1)`, and it is meaningless.** The rule from module 10 applies exactly: when a function reports through an `error_code`, check the code, never the returned value. The atomic write is the pattern worth taking away: writing directly to `config.txt` means a reader can observe it half-written, and a crash mid-write leaves it truncated with no original to fall back on. Writing to `config.txt.tmp` **in the same directory** and renaming is atomic, so there is no window at all.",
        },
      ],
      pitfalls: [
        {
          title: "The temp file must be on the same filesystem, and `rename` is not enough for durability",
          body: "`fs::rename` is only atomic within one filesystem — moving across a mount point is a copy-then-delete, which reintroduces the window. So the temp file goes in the *target's directory*, not `/tmp`. Separately, atomicity is not durability: after `rename` returns, the data may still be in the page cache, and a power loss can leave the directory entry pointing at an empty file. A genuinely durable write is: write the temp file, `fsync` it, `rename`, then `fsync` the *directory*. The standard library exposes none of that, so it means `::fsync` on the file descriptor — which is why databases do not use `<fstream>`.",
        },
      ],
    },
    {
      id: "toctou",
      heading: "TOCTOU, and why checking first is wrong",
      body: [
        "**Every filesystem check is stale the moment it returns.** Between `fs::exists(p)` and the `ifstream` that opens `p`, another process can delete it, replace it, or replace it with a symlink pointing somewhere else. That gap is a **time-of-check to time-of-use** race.",
        "It is a correctness bug in ordinary code and a **security vulnerability** in privileged code: the classic exploit is to pass a path that checks out as a harmless file and swap it for a symlink to `/etc/passwd` before the write.",
        "**The fix is to attempt the operation and handle its failure, rather than checking first.** Open the file and check whether the stream is good; call `fs::remove` and inspect the `error_code`; use `create_directories`, which succeeds if the directory already exists.",
        "**Where a check is genuinely unavoidable, operate on the handle rather than the path.** Open once, then use the file descriptor — `fstat` on the fd rather than `stat` on the path — so the object cannot be swapped underneath you. POSIX's `openat`, `O_NOFOLLOW` and `O_EXCL` exist for exactly this, and `<filesystem>` exposes none of them.",
        "**`O_EXCL` with `O_CREAT` is the standard atomic \"create only if absent\"**, and is the correct way to implement a lock file — `if (!exists(p)) create(p)` is the textbook race.",
        "**Never construct a path from untrusted input without normalising it.** `fs::weakly_canonical` resolves `..` and symlinks; checking that the result is still under your intended root is what prevents directory traversal.",
      ],
      examples: [
        {
          id: "toctou-example",
          title: "The racy shape, and the shape that cannot race",
          lang: "cpp",
          code: `#include <filesystem>
#include <fstream>
#include <iostream>
#include <optional>
#include <string>
#include <system_error>

namespace fs = std::filesystem;

// ── RACY: the file can vanish, or be replaced, between the two calls ─
std::optional<std::string> readRacy(const fs::path& p) {
    if (!fs::exists(p)) return std::nullopt;      // time of CHECK
    std::ifstream in{p};                          // time of USE
    return std::string{std::istreambuf_iterator<char>{in}, {}};
}

// ── CORRECT: attempt it, and let the attempt report failure ─────────
std::optional<std::string> readSafe(const fs::path& p) {
    std::ifstream in{p, std::ios::binary};
    if (!in) return std::nullopt;                 // one operation, no gap
    return std::string{std::istreambuf_iterator<char>{in}, {}};
}

// ── Path validation against directory traversal ─────────────────────
std::optional<fs::path> resolveUnder(const fs::path& root,
                                     std::string_view userSupplied) {
    std::error_code ec;
    fs::path candidate = fs::weakly_canonical(root / userSupplied, ec);
    if (ec) return std::nullopt;
    fs::path base = fs::weakly_canonical(root, ec);
    if (ec) return std::nullopt;

    // The resolved path must still be under the root.
    auto [rootEnd, _] = std::mismatch(base.begin(), base.end(),
                                      candidate.begin(), candidate.end());
    if (rootEnd != base.end()) return std::nullopt;   // escaped the root
    return candidate;
}

int main() {
    fs::path dir = fs::temp_directory_path() / "cpp14_toctou";
    std::error_code ec;
    fs::create_directories(dir / "public", ec);
    { std::ofstream{dir / "public" / "ok.txt"} << "safe contents\n"; }
    { std::ofstream{dir / "secret.txt"}        << "SECRET\n"; }

    std::cout << "readSafe(missing)   : "
              << (readSafe(dir / "nope.txt") ? "read" : "absent (no race)") << "\n";
    std::cout << "readSafe(present)   : "
              << (readSafe(dir / "public" / "ok.txt") ? "read" : "absent") << "\n";

    fs::path root = dir / "public";
    for (std::string_view req : {"ok.txt", "../secret.txt", "sub/../ok.txt"}) {
        auto r = resolveUnder(root, req);
        std::cout << "  request \"" << req << "\" -> "
                  << (r ? "allowed" : "REJECTED (escapes root)") << "\n";
    }

    fs::remove_all(dir, ec);
}`,
          output: `readSafe(missing)   : absent (no race)
readSafe(present)   : read
  request "ok.txt" -> allowed
  request "../secret.txt" -> REJECTED (escapes root)
  request "sub/../ok.txt" -> allowed`,
          explanation:
            "**`readSafe` performs one operation and asks whether it worked**, so there is no window between check and use. `readRacy` looks more careful and is strictly worse. The traversal check is the other half: `../secret.txt` resolves outside the root and is rejected, while `sub/../ok.txt` normalises back inside and is allowed — which is why you must compare the *canonicalised* path against the *canonicalised* root rather than string-matching the input for `..`, a filter that `....//` and URL encoding defeat.",
        },
      ],
    },
    {
      id: "handles",
      heading: "OS handles and partial I/O",
      body: [
        "**Every OS resource is a handle that must be released exactly once**, and C++'s answer is the same as everywhere else in this track: wrap it in a type whose destructor releases it. Module 9 lesson 1 built this for `FILE*`; sockets, file descriptors, shared memory mappings and timers are identical.",
        "**The wrapper must be move-only.** Copying a handle means two owners and a double close, which on POSIX is worse than a double free: the fd number is reused, so the second close may close *someone else's* file. Delete the copy operations and implement the move.",
        "**Use a sentinel, not zero.** File descriptor 0 is stdin, so `-1` is the invalid value; on Windows it is `INVALID_HANDLE_VALUE`, which is not null. A default-constructed wrapper must hold the sentinel and its destructor must check for it.",
        "**Sockets add partial I/O, which is where the real bugs are.** `write` may write fewer bytes than requested, and `read` may return fewer than asked for — that is not an error, it is normal. **Code that treats one `write` call as \"the message was sent\" is broken** and will fail under load, on slow networks, or with large messages.",
        "**Both must be looped**, and both must handle `EINTR` — interrupted by a signal — by retrying rather than failing.",
        "**And a stream socket has no message boundaries.** TCP delivers a byte stream: two `send` calls may arrive as one `read`, or one `send` may arrive as three. Any protocol over TCP needs its own framing — a length prefix or a delimiter — and lesson 7 builds one.",
      ],
      examples: [
        {
          id: "handle-raii",
          title: "A move-only file descriptor, and correct partial I/O",
          lang: "cpp",
          code: `#include <cerrno>
#include <cstring>
#include <fcntl.h>
#include <iostream>
#include <span>
#include <string>
#include <unistd.h>
#include <utility>

// A move-only owning file descriptor. Copying would double-close, and
// on POSIX that can close a DIFFERENT file, because fds are reused.
class Fd {
public:
    Fd() = default;
    explicit Fd(int fd) noexcept : fd_{fd} {}

    ~Fd() { reset(); }

    Fd(Fd&& other) noexcept : fd_{std::exchange(other.fd_, -1)} {}
    Fd& operator=(Fd&& other) noexcept {
        if (this != &other) { reset(); fd_ = std::exchange(other.fd_, -1); }
        return *this;
    }
    Fd(const Fd&)            = delete;
    Fd& operator=(const Fd&) = delete;

    int  get()   const noexcept { return fd_; }
    bool valid() const noexcept { return fd_ >= 0; }
    explicit operator bool() const noexcept { return valid(); }

    void reset() noexcept {
        if (fd_ >= 0) { ::close(fd_); fd_ = -1; }
    }
    [[nodiscard]] int release() noexcept { return std::exchange(fd_, -1); }

private:
    int fd_ = -1;                     // -1, not 0: fd 0 is stdin
};

// write() may write FEWER bytes than asked. That is not an error.
bool writeAll(int fd, std::span<const char> data) {
    while (!data.empty()) {
        ssize_t n = ::write(fd, data.data(), data.size());
        if (n < 0) {
            if (errno == EINTR) continue;          // signal: retry
            return false;
        }
        data = data.subspan(static_cast<std::size_t>(n));
    }
    return true;
}

// read() may return fewer bytes than asked, and 0 means EOF.
bool readExactly(int fd, std::span<char> out) {
    while (!out.empty()) {
        ssize_t n = ::read(fd, out.data(), out.size());
        if (n == 0) return false;                  // EOF before we finished
        if (n < 0) { if (errno == EINTR) continue; return false; }
        out = out.subspan(static_cast<std::size_t>(n));
    }
    return true;
}

int main() {
    const char* path = "/tmp/cpp14_fd_demo.txt";

    Fd out{::open(path, O_WRONLY | O_CREAT | O_TRUNC, 0644)};
    if (!out) { std::cerr << "open failed: " << std::strerror(errno) << "\\n"; return 1; }

    std::string payload(5000, 'x');                // big enough to matter
    payload += "\\nEND\\n";
    std::cout << "writeAll " << payload.size() << " bytes: "
              << (writeAll(out.get(), payload) ? "ok" : "failed") << "\\n";
    out.reset();                                   // close before reading

    Fd in{::open(path, O_RDONLY)};
    std::string buf(payload.size(), '\\0');
    std::cout << "readExactly: "
              << (readExactly(in.get(), buf) ? "ok" : "failed") << "\\n";
    std::cout << "round trip matches: " << std::boolalpha
              << (buf == payload) << "\\n";

    // Move semantics: ownership transfers, the source becomes invalid.
    Fd moved = std::move(in);
    std::cout << "after move: source valid = " << in.valid()
              << ", dest valid = " << moved.valid() << "\\n";

    ::unlink(path);
}`,
          output: `writeAll 5005 bytes: ok
readExactly: ok
round trip matches: true
after move: source valid = false, dest valid = true`,
          explanation:
            "**`writeAll` and `readExactly` are loops, and that is not defensive programming — it is the contract.** A single `write` returning fewer bytes is normal behaviour, not an error, and code assuming otherwise fails under exactly the conditions you cannot reproduce locally. The `EINTR` retry is the other half: a signal arriving mid-call makes the syscall return early, and treating that as failure produces intermittent bugs. `Fd` uses `-1` as its sentinel because file descriptor 0 is stdin, and it is move-only because two owners would close the same number twice — and by then that number may name a different file.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does `<filesystem>` offer two forms of every operation?",
      answer:
        "Because a filesystem failure is sometimes exceptional and sometimes entirely expected, and the library refuses to decide. The throwing form suits cases where failure means the operation cannot continue; the `error_code&` form suits cases you expect — probing for an optional config file, checking existence. The critical detail is that when the error-code form fails, the *return value is meaningless*: `fs::file_size` returns `uintmax_t(-1)`, which prints as 18446744073709551615. That is the out-parameter staleness problem, so always check the code and never the value.",
    },
    {
      question: "How do you write a file so a reader never sees it half-written?",
      answer:
        "Write to a temporary file in the *same directory* as the target, then `rename` it over the target. `rename` is atomic within a filesystem, so a concurrent reader observes either the complete old contents or the complete new ones. The temp file must be in the same directory because renaming across a mount point degrades to copy-then-delete and reintroduces the window. Note atomicity is not durability: after `rename` returns the data may still be in the page cache, so a genuinely durable write is write, `fsync` the file, `rename`, then `fsync` the directory — none of which the standard library exposes.",
    },
    {
      question: "What is TOCTOU and how do you avoid it?",
      answer:
        "Time-of-check to time-of-use: any filesystem check is stale the moment it returns, because another process can delete, replace or symlink the path between your `exists()` and your `open()`. It is a correctness bug generally and a privilege-escalation vulnerability in privileged code — the classic exploit swaps a benign file for a symlink to something sensitive. The fix is to attempt the operation and handle its failure rather than checking first: open the stream and test whether it is good. Where a check is unavoidable, operate on the *handle* rather than the path, and use `O_EXCL | O_CREAT` for atomic create-if-absent rather than `if (!exists) create`.",
    },
    {
      question: "How do you prevent directory traversal from untrusted paths?",
      answer:
        "Canonicalise and then verify containment. Join the user's input to your root, run `fs::weakly_canonical` to resolve `..` and symlinks, canonicalise the root too, and check that the resolved path still begins with the resolved root. String-filtering the input for `..` does not work — `....//`, URL encoding and symlinks all defeat it — and checking before resolution misses the case where a symlink inside the tree points out of it. Note that a path like `sub/../ok.txt` normalises back inside the root and should be allowed, which a naive textual filter would reject.",
    },
    {
      question: "Why must an OS handle wrapper be move-only, and why not use 0 as the invalid value?",
      answer:
        "Move-only because copying means two owners and a double close, and on POSIX that is worse than a double free: file descriptor numbers are reused immediately, so the second `close` may close a descriptor another part of the program has since opened — closing someone else's file with no diagnostic. As for the sentinel, descriptor 0 is stdin, so 0 is a perfectly valid fd; `-1` is the invalid value on POSIX, and on Windows it is `INVALID_HANDLE_VALUE`, which is not null either. A default-constructed wrapper must hold the sentinel and the destructor must check for it.",
    },
    {
      question: "Why must socket reads and writes be looped?",
      answer:
        "Because partial transfer is normal, not an error. `write` may accept fewer bytes than offered when the kernel buffer is full; `read` may return fewer than requested when only some data has arrived. Code that treats one `write` call as \"the message was sent\" works locally with small messages and fails under load, on slow links, or with large payloads. Both must loop until the full amount is transferred, and both must retry on `EINTR`, since a signal can cut a syscall short. Separately, TCP has no message boundaries at all — two sends may arrive as one read — so any protocol needs its own framing, such as a length prefix.",
    },
  ],
  takeaways: [
    "Every `<filesystem>` call has a throwing form and an `error_code&` form",
    "When the error-code form fails the return value is garbage — check `ec`, not the value",
    "`fs::path` handles separators and components; never build paths by concatenating strings",
    "Atomic write: temp file in the *same directory*, then `rename`",
    "Atomicity is not durability — that needs `fsync` on the file and the directory",
    "Every check-then-act on a path is a TOCTOU race",
    "Attempt the operation and handle failure rather than checking first",
    "Use `O_EXCL | O_CREAT` for atomic create-if-absent, never `if (!exists) create`",
    "Validate untrusted paths by canonicalising and checking containment, not by filtering `..`",
    "Wrap OS handles in move-only RAII types — copying double-closes a reused fd number",
    "Use `-1` as the fd sentinel; 0 is stdin",
    "`write` and `read` may transfer fewer bytes than asked — loop, and retry on `EINTR`",
    "TCP has no message boundaries; any protocol needs its own framing",
  ],
  status: "available",
};
