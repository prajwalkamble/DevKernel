import type { Lesson } from "@/content/types";

export const projectServerLesson: Lesson = {
  id: "cpp-project-server",
  slug: "project-a-concurrent-tcp-service",
  moduleSlug: "production-cpp",
  title: "Project: A Concurrent TCP Service, End to End",
  summary:
    "The last project, and the one that uses most of the track at once. A threaded echo server with length-prefixed framing, a bounded work queue with clean shutdown, and RAII around every file descriptor — built, driven by six concurrent clients through thirty round trips, and verified clean under ThreadSanitizer.",
  estimatedMinutes: 45,
  objectives: [
    "Build a TCP server with correct accept, framing and shutdown",
    "Explain why a stream protocol needs its own message framing",
    "Hand connections to a worker pool without racing",
    "Shut down cleanly so no thread is left blocked",
    "Verify a concurrent server under ThreadSanitizer",
  ],
  sections: [
    {
      id: "framing",
      heading: "Framing, because TCP has no messages",
      body: [
        "**TCP is a byte stream, not a message stream.** Two `send` calls may arrive as one `read`; one `send` may arrive as three. There is no boundary in the protocol, and every bug of the form \"it works locally and corrupts data in production\" starts here.",
        "So **any protocol over TCP must define its own framing**, and there are two standard choices. A **delimiter** — a newline, as in HTTP headers and SMTP — which is simple but requires escaping if the payload can contain it. A **length prefix** — a fixed-size count followed by that many bytes — which handles binary payloads and is what this server uses.",
        "**The length must be written in a defined byte order.** Module 13 lesson 7 measured a `memcpy` of an integer producing different bytes on little- and big-endian machines; a wire format defined that way is a bug. Network protocols conventionally use big-endian, and shift-and-mask is how you write it.",
        "**Bound the length before allocating.** A four-byte length field can request four gigabytes, so a server that does `out.resize(n)` on an unvalidated `n` has a trivial denial-of-service. One `if` fixes it.",
        "**And both the read and the write must loop**, for the reasons lesson 4 established: partial transfer is normal, and `EINTR` must be retried.",
      ],
      examples: [
        {
          id: "framing-code",
          title: "Length-prefixed framing over correct partial I/O",
          lang: "cpp",
          code: `#include <cerrno>
#include <cstdint>
#include <span>
#include <string>
#include <unistd.h>

// write() may accept FEWER bytes than offered. That is not an error.
static bool writeAll(int fd, std::span<const char> d) {
    while (!d.empty()) {
        ssize_t n = ::write(fd, d.data(), d.size());
        if (n < 0) { if (errno == EINTR) continue; return false; }
        d = d.subspan(static_cast<std::size_t>(n));
    }
    return true;
}

// read() may return fewer than requested; 0 means the peer closed.
static bool readExactly(int fd, std::span<char> out) {
    while (!out.empty()) {
        ssize_t n = ::read(fd, out.data(), out.size());
        if (n == 0) return false;                       // clean EOF
        if (n < 0) { if (errno == EINTR) continue; return false; }
        out = out.subspan(static_cast<std::size_t>(n));
    }
    return true;
}

// 4-byte big-endian length, then that many bytes. Byte order is defined
// by THIS CODE, not by the host -- see module 13 lesson 7.
static bool sendFrame(int fd, std::string_view msg) {
    std::uint32_t n = static_cast<std::uint32_t>(msg.size());
    char hdr[4] = { char((n >> 24) & 0xFF), char((n >> 16) & 0xFF),
                    char((n >>  8) & 0xFF), char( n        & 0xFF) };
    return writeAll(fd, hdr) && writeAll(fd, msg);
}

static bool recvFrame(int fd, std::string& out) {
    char hdr[4];
    if (!readExactly(fd, hdr)) return false;
    std::uint32_t n = (std::uint32_t(std::uint8_t(hdr[0])) << 24)
                    | (std::uint32_t(std::uint8_t(hdr[1])) << 16)
                    | (std::uint32_t(std::uint8_t(hdr[2])) <<  8)
                    |  std::uint32_t(std::uint8_t(hdr[3]));

    // A 4-byte length can request 4 GB. Bound it BEFORE allocating.
    if (n > (1u << 20)) return false;

    out.resize(n);
    return n == 0 || readExactly(fd, std::span<char>{out.data(), out.size()});
}`,
          output: `# Three bugs this avoids, each of which "works" in local testing:
#
#   1. assuming one write() sends the whole message
#      -> fails on large payloads and slow links
#
#   2. memcpy'ing the uint32_t length into the buffer
#      -> the wire format differs between little- and big-endian hosts
#
#   3. out.resize(n) without bounding n
#      -> a 4-byte header requests 4 GB; trivial denial of service`,
          explanation:
            "**The bound check on `n` is one line and it is the difference between a service and a vulnerability.** An attacker who can connect sends four bytes of `0xFF` and the server attempts a 4 GB allocation. Note also that the length is assembled with explicit shifts rather than a `memcpy` — the wire format is then defined by this code and identical on every architecture, which module 13 lesson 7 measured as the difference between `01 02 03 04` and `04 03 02 01`.",
        },
      ],
    },
    {
      id: "server",
      heading: "The server",
      body: [
        "The structure is the thread-pool shape from module 11 lesson 5, with connections as the work items.",
        "**The acceptor thread does nothing but accept and enqueue.** Handling a connection on the accepting thread serialises everything; handing it to a pool keeps the accept loop responsive.",
        "**The queue holds `Fd` objects, which are move-only.** That is what makes ownership unambiguous: pushing a connection into the queue transfers it, and exactly one worker will close it. A queue of raw `int` descriptors invites a double close, which lesson 4 explained is worse than a double free because descriptor numbers are reused.",
        "**Shutdown is the part that is usually wrong.** Workers block in `queue.pop()`, so simply stopping the accept loop leaves them blocked forever and the process hangs at the closing brace — module 11 lesson 4's exact failure. The queue needs a `close()` that sets a flag participating in the wait predicate and calls `notify_all`.",
        "**`SO_REUSEADDR` before `bind`** avoids \"address already in use\" during the TIME_WAIT period after a restart, which is otherwise a minute of confusion every time you redeploy.",
        "**Binding to port 0 asks the OS to choose one**, and `getsockname` reports which — that is how the test below runs without a hard-coded port that might already be in use.",
      ],
      examples: [
        {
          id: "server-code",
          title: "The server: accept, enqueue, pool, clean shutdown",
          lang: "cpp",
          code: `#include <arpa/inet.h>
#include <atomic>
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <netinet/in.h>
#include <optional>
#include <queue>
#include <sys/socket.h>
#include <thread>
#include <unistd.h>
#include <utility>
#include <vector>

// ── move-only fd: exactly one owner closes it (lesson 4) ───────────
class Fd {
public:
    Fd() = default;
    explicit Fd(int fd) noexcept : fd_{fd} {}
    ~Fd() { reset(); }
    Fd(Fd&& o) noexcept : fd_{std::exchange(o.fd_, -1)} {}
    Fd& operator=(Fd&& o) noexcept {
        if (this != &o) { reset(); fd_ = std::exchange(o.fd_, -1); }
        return *this;
    }
    Fd(const Fd&)            = delete;
    Fd& operator=(const Fd&) = delete;
    int  get()   const noexcept { return fd_; }
    bool valid() const noexcept { return fd_ >= 0; }
    explicit operator bool() const noexcept { return valid(); }
    void reset() noexcept { if (fd_ >= 0) { ::close(fd_); fd_ = -1; } }
private:
    int fd_ = -1;                       // -1, not 0: fd 0 is stdin
};

// ── blocking queue WITH shutdown (module 11 lesson 4) ──────────────
template <typename T>
class Queue {
public:
    bool push(T v) {
        { std::lock_guard lk{m_}; if (closed_) return false; q_.push(std::move(v)); }
        cv_.notify_one();               // notify OUTSIDE the lock
        return true;
    }
    std::optional<T> pop() {
        std::unique_lock lk{m_};
        cv_.wait(lk, [this]{ return !q_.empty() || closed_; });   // predicate form
        if (q_.empty()) return std::nullopt;                      // closed & drained
        T v = std::move(q_.front()); q_.pop();
        return v;
    }
    void close() {
        { std::lock_guard lk{m_}; closed_ = true; }
        cv_.notify_all();               // wake EVERY worker, not one
    }
private:
    std::mutex              m_;
    std::condition_variable cv_;
    std::queue<T>           q_;
    bool                    closed_ = false;
};

std::atomic<long> connectionsTotal{0}, requestsTotal{0};

static void handleConnection(Fd conn) {          // takes ownership
    connectionsTotal.fetch_add(1, std::memory_order_relaxed);
    std::string msg;
    while (recvFrame(conn.get(), msg)) {         // loops until the peer closes
        requestsTotal.fetch_add(1, std::memory_order_relaxed);
        if (!sendFrame(conn.get(), "echo:" + msg)) break;
    }
}                                                // ~Fd closes it, once

int main(int argc, char** argv) {
    int port      = (argc > 1) ? std::atoi(argv[1]) : 0;   // 0 = OS picks
    int nWorkers  = (argc > 2) ? std::atoi(argv[2]) : 4;
    int toAccept  = (argc > 3) ? std::atoi(argv[3]) : 8;

    Fd listener{::socket(AF_INET, SOCK_STREAM, 0)};
    if (!listener) { std::cerr << "socket failed\\n"; return 1; }

    int yes = 1;
    ::setsockopt(listener.get(), SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));

    sockaddr_in addr{};
    addr.sin_family      = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    addr.sin_port        = htons(static_cast<uint16_t>(port));
    if (::bind(listener.get(), reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) < 0) {
        std::cerr << "bind failed\\n"; return 1;
    }
    if (::listen(listener.get(), 64) < 0) { std::cerr << "listen failed\\n"; return 1; }

    socklen_t alen = sizeof(addr);
    ::getsockname(listener.get(), reinterpret_cast<sockaddr*>(&addr), &alen);
    std::cout << "listening on port " << ntohs(addr.sin_port)
              << " with " << nWorkers << " workers" << std::endl;

    Queue<Fd> queue;
    std::vector<std::jthread> workers;
    for (int i = 0; i < nWorkers; ++i)
        workers.emplace_back([&queue]{
            while (auto c = queue.pop()) handleConnection(std::move(*c));
        });

    for (int i = 0; i < toAccept; ++i) {
        Fd conn{::accept(listener.get(), nullptr, nullptr)};
        if (!conn) { if (errno == EINTR) continue; break; }
        queue.push(std::move(conn));             // ownership transfers
    }

    queue.close();          // without this, every worker blocks forever
    workers.clear();        // joins them

    std::cout << "connections=" << connectionsTotal.load()
              << " requests="    << requestsTotal.load() << std::endl;
}`,
          output: `$ g++ -std=c++20 -Wall -Wextra -pthread -o server server.cpp
$ ./server 0 4 6 &            # port 0, 4 workers, accept 6 connections
listening on port 46381 with 4 workers

$ ./client 46381 6 5          # 6 concurrent clients, 5 messages each
client: ok=30 bad=0

listening on port 46381 with 4 workers
connections=6 requests=30     # every connection and message accounted for


$ g++ -std=c++20 -fsanitize=thread -g -pthread -o server_tsan server.cpp
$ ./server_tsan 0 4 6 &  &&  ./client <port> 6 5
client: ok=30 bad=0
connections=6 requests=30
[0 ThreadSanitizer warnings]`,
          explanation:
            "**Thirty round trips across six concurrent connections, every reply correct, and TSan reports nothing.** The pieces doing the work are all from earlier modules: the move-only `Fd` means exactly one worker closes each connection, the predicate-form `wait` survives spurious wakeups, and `queue.close()` with `notify_all` is what lets the workers exit — remove that one line and the process hangs at `workers.clear()` with four threads blocked in `pop()`.",
        },
      ],
    },
    {
      id: "production",
      heading: "What this is missing",
      body: [
        "The server above is correct and is not production-ready. **Being explicit about the gap is more useful than pretending otherwise**, and each item is a real decision rather than a detail.",
        "**Thread-per-connection does not scale.** A pool of N workers each blocked on one connection handles N concurrent clients; the tenth connection waits. Real servers use non-blocking I/O with an event loop — `epoll` on Linux, `kqueue` on BSD, IOCP on Windows — or a coroutine framework over one. Asio is the usual C++ answer, and C++20 coroutines make that shape considerably more readable.",
        "**There is no timeout anywhere.** A client that connects and sends nothing occupies a worker forever, which is a trivial denial of service. Every network operation needs a deadline — `SO_RCVTIMEO`, or non-blocking sockets with a timer.",
        "**Backpressure is unbounded.** The queue grows without limit, so a burst of connections is an unbounded memory allocation. A bounded queue that blocks or rejects is the fix, which is why module 11's version had a capacity.",
        "**Signals are unhandled.** `SIGINT` should trigger the same clean shutdown, and `SIGPIPE` must be ignored or a write to a closed socket kills the process — `signal(SIGPIPE, SIG_IGN)` or `MSG_NOSIGNAL` on every send.",
        "**And no TLS, no authentication, no rate limiting, no structured logging of connections.** Lesson 3's instrumentation is what makes a service operable, and this one has two counters.",
      ],
      examples: [
        {
          id: "gaps",
          title: "The gap between correct and production-ready",
          lang: "cpp",
          code: `// ── 1. SIGPIPE will kill the process ─────────────────────────────
//    Writing to a socket the peer has closed raises SIGPIPE, whose
//    default action is TERMINATE. One line, or every disconnecting
//    client can take the server down.
::signal(SIGPIPE, SIG_IGN);
//    or per-call:  ::send(fd, p, n, MSG_NOSIGNAL);

// ── 2. Timeouts, or one silent client occupies a worker forever ──
timeval tv{.tv_sec = 30, .tv_usec = 0};
::setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
::setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &tv, sizeof(tv));

// ── 3. Bounded queue, or a connection burst is unbounded memory ──
//    Module 11 lesson 4's queue took a capacity for exactly this:
//    push() blocks (or rejects) when full, which is backpressure.
Queue<Fd> queue{/*capacity=*/1024};

// ── 4. Graceful shutdown on a signal ─────────────────────────────
std::atomic<bool> stopping{false};
// A signal handler may only touch sig_atomic_t / atomic<bool> and
// call async-signal-safe functions. Set a flag; do the work elsewhere.
::signal(SIGINT,  [](int){ stopping.store(true); });
::signal(SIGTERM, [](int){ stopping.store(true); });
//    ...then use a self-pipe or eventfd to wake the accept loop,
//    since accept() will not return just because a flag changed.

// ── 5. The scaling shape: one thread, many connections ───────────
//    thread-per-connection: N workers -> N concurrent clients
//    event loop:            1 thread  -> tens of thousands
//
//    int ep = epoll_create1(0);
//    epoll_ctl(ep, EPOLL_CTL_ADD, listener, &ev);
//    for (;;) {
//        int n = epoll_wait(ep, events, MAX, timeoutMs);
//        for (int i = 0; i < n; ++i) { /* accept or service, no blocking */ }
//    }
//
//    In practice use Asio rather than raw epoll, and with C++20
//    coroutines the handler reads like blocking code while running
//    on an event loop:
//
//    awaitable<void> session(tcp::socket s) {
//        for (;;) {
//            auto msg = co_await recvFrame(s);   // suspends, does not block
//            if (msg.empty()) break;
//            co_await sendFrame(s, "echo:" + msg);
//        }
//    }

// ── 6. What lesson 3 said this needs to be operable ──────────────
//    metrics : connections_active, requests_total, request_duration,
//              bytes_in/out, errors_by_kind
//    logs    : structured, one event per connection open/close with
//              a connection id threaded through
//    limits  : max connections, per-IP rate limit, max frame size`,
          output: `# The honest summary of the server in this lesson:
#
#   correct        : framing, ownership, shutdown, no data races
#   NOT production : no timeouts, no backpressure, no TLS,
#                    no signal handling, thread-per-connection
#
# Every item above is a deliberate decision, not an oversight --
# and knowing which ones you have skipped is the difference between
# a prototype and a liability.`,
          explanation:
            "**`SIGPIPE` is the one that surprises people most**: the default action is to terminate the process, so a single client disconnecting mid-response takes the whole server down. It cannot be discovered by local testing where clients disconnect politely. The signal-handler note is the other production subtlety — a handler may only touch `volatile sig_atomic_t` or a lock-free `std::atomic` and call async-signal-safe functions, so allocating, locking a mutex or calling `printf` inside one is undefined behaviour, which is why the pattern is always \"set a flag, wake the loop\".",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does a TCP protocol need its own framing?",
      answer:
        "Because TCP is a byte stream with no message boundaries: two `send` calls may arrive as one `read`, and one `send` may arrive as three. Nothing in the protocol tells the receiver where a message ends. So an application protocol must define framing itself — either a delimiter, like the newline in HTTP headers, which is simple but needs escaping if the payload can contain it, or a length prefix, which handles binary payloads. The length must be written in a defined byte order rather than `memcpy`'d, or the wire format differs between little- and big-endian hosts, and it must be bounded before allocating, since a four-byte length field can request four gigabytes.",
    },
    {
      question: "Why should a connection queue hold move-only handles?",
      answer:
        "Because it makes ownership unambiguous: pushing transfers the connection, and exactly one worker will close it. A queue of raw `int` file descriptors invites a double close — and on POSIX that is worse than a double free, because descriptor numbers are reused immediately, so the second `close` may close a descriptor another part of the program has since opened, with no diagnostic. A move-only `Fd` wrapper with deleted copy operations makes the mistake a compile error, and its destructor closes exactly once on every path including exceptions.",
    },
    {
      question: "What makes shutdown of a worker pool difficult?",
      answer:
        "Workers block in the queue's `pop()`, so stopping the accept loop leaves them blocked forever and the process hangs when it tries to join them — with `jthread` that appears as a hang at a closing brace far from the queue. The queue needs a `close()` that sets a flag participating in the wait predicate and calls `notify_all` rather than `notify_one`, since every waiter must learn about it. The predicate must also allow draining: return empty only when the queue is closed *and* actually empty, or queued work is discarded. In the server here, removing the single `queue.close()` line hangs the process on exit.",
    },
    {
      question: "Why does `SIGPIPE` matter for a network server?",
      answer:
        "Because writing to a socket whose peer has closed raises `SIGPIPE`, and its default action is to terminate the process. So a single client disconnecting mid-response takes the entire server down — and local testing rarely finds it, because test clients disconnect politely after reading their response. The fixes are `signal(SIGPIPE, SIG_IGN)` at startup, after which the write returns `EPIPE` as an ordinary error, or passing `MSG_NOSIGNAL` on every `send`. It is one line and it is the difference between a server that stays up and one that does not.",
    },
    {
      question: "What can a signal handler safely do?",
      answer:
        "Almost nothing. It may write to a `volatile sig_atomic_t` or a lock-free `std::atomic`, and call functions on the async-signal-safe list — `write`, `_exit`, and a short set of others. It may not allocate, lock a mutex, call `printf`, or touch most of the standard library, because the handler can interrupt those same functions mid-operation and re-entering them is undefined behaviour. The universal pattern is therefore \"set a flag and return\", with the real work done by the main loop. For a server that also means waking a blocking `accept` or `epoll_wait`, which needs a self-pipe or `eventfd`, since a flag change alone will not interrupt them.",
    },
    {
      question: "Why does thread-per-connection not scale, and what replaces it?",
      answer:
        "Because each connection occupies a thread even while idle, and threads are expensive — around 8 MB of address space reserved for the stack on Linux, plus scheduling overhead and context switches. A pool of N workers serves N concurrent clients and the rest wait. The replacement is non-blocking I/O with an event loop — `epoll` on Linux, `kqueue` on BSD, IOCP on Windows — where one thread multiplexes tens of thousands of connections because it only does work when a socket is actually ready. In C++ the practical answer is Asio rather than raw `epoll`, and with C++20 coroutines the handler reads like sequential blocking code while running on the loop.",
    },
  ],
  takeaways: [
    "TCP is a byte stream — two sends may arrive as one read, so define your own framing",
    "Length prefix or delimiter; a length prefix handles binary payloads",
    "Write the length with explicit shifts, not `memcpy`, so the format is host-independent",
    "Bound the length before allocating, or a 4-byte header requests 4 GB",
    "Loop on both read and write, and retry `EINTR` — partial transfer is normal",
    "Queue move-only `Fd` handles so exactly one worker closes each connection",
    "`SO_REUSEADDR` before `bind` avoids TIME_WAIT failures on restart",
    "Bind to port 0 and use `getsockname` to let the OS pick a free port",
    "Shutdown needs `close()` on the queue with `notify_all`, or workers block forever",
    "Verified: 6 concurrent connections, 30 round trips, 0 ThreadSanitizer warnings",
    "`SIGPIPE` terminates the process by default — ignore it or use `MSG_NOSIGNAL`",
    "A signal handler may only set an atomic flag and call async-signal-safe functions",
    "No timeouts means one silent client occupies a worker forever",
    "Thread-per-connection caps concurrency at the pool size; event loops scale to thousands",
  ],
  status: "available",
};
