import type { Lesson } from "@/content/types";

export const observabilityLesson: Lesson = {
  id: "cpp-observability",
  slug: "configuration-logging-and-observability",
  moduleSlug: "production-cpp",
  title: "Configuration, Structured Logging & Observability",
  summary:
    "What a program needs in order to be operated rather than merely run. Configuration with a defined precedence and validation at startup, logs as structured events instead of interpolated sentences, and the three signals that let you answer questions you did not anticipate.",
  estimatedMinutes: 35,
  objectives: [
    "Design configuration with a clear precedence order and startup validation",
    "Emit structured logs rather than formatted prose",
    "Choose log levels that mean something operationally",
    "Distinguish logs, metrics and traces and know what each answers",
    "Keep instrumentation cheap enough to leave enabled",
  ],
  sections: [
    {
      id: "configuration",
      heading: "Configuration",
      body: [
        "**Configuration is an input, and it deserves the same treatment as any other untrusted input**: parse it once, validate it completely, and turn it into a typed object the rest of the program uses.",
        "**Establish a precedence order and document it.** The conventional one, highest first: command-line flags, then environment variables, then a config file, then compiled-in defaults. Each layer overrides the ones below, so an operator can override anything without editing a file.",
        "**Validate everything at startup, not at first use.** A service that starts successfully and fails forty minutes later on a malformed timeout is far worse than one that refuses to start. Parse the whole configuration, check every constraint, and exit non-zero with a specific message if anything is wrong.",
        "**Turn it into a typed struct immediately.** Passing a `map<string,string>` around means every consumer re-parses and re-validates, and a typo in a key is a runtime surprise. A `struct Config` with real types — `std::chrono::milliseconds`, an `enum class`, a validated `Port` — means a missing field is a compile error and an invalid value is impossible past startup.",
        "**Never log secrets.** A config object holding credentials needs a printing function that redacts them, and the discipline of using it. This is the failure that ends up in a public log aggregator.",
        "**Make the effective configuration observable.** A `--dump-config` flag, or logging the resolved values at startup with secrets redacted, removes an entire class of \"why is it behaving like that\" investigation.",
      ],
      examples: [
        {
          id: "config",
          title: "Layered configuration, validated once",
          lang: "cpp",
          code: `#include <charconv>
#include <chrono>
#include <cstdlib>
#include <iostream>
#include <map>
#include <optional>
#include <string>
#include <string_view>
#include <vector>

enum class LogLevel { Trace, Debug, Info, Warn, Error };

// The typed result. Past validation, every value here is known good.
struct Config {
    std::string               host      = "0.0.0.0";
    std::uint16_t             port      = 8080;
    std::chrono::milliseconds timeout   = std::chrono::milliseconds{5000};
    int                       workers   = 4;
    LogLevel                  logLevel  = LogLevel::Info;
    std::string               dbPassword;          // secret

    // Redacting print. The ONLY way this object should be logged.
    std::string describe() const {
        return "host=" + host + " port=" + std::to_string(port)
             + " timeout=" + std::to_string(timeout.count()) + "ms"
             + " workers=" + std::to_string(workers)
             + " db_password=" + (dbPassword.empty() ? "<unset>" : "<redacted>");
    }
};

std::optional<LogLevel> parseLevel(std::string_view s) {
    if (s == "trace") return LogLevel::Trace;
    if (s == "debug") return LogLevel::Debug;
    if (s == "info")  return LogLevel::Info;
    if (s == "warn")  return LogLevel::Warn;
    if (s == "error") return LogLevel::Error;
    return std::nullopt;
}

std::optional<long> parseLong(std::string_view s) {
    long v{};
    auto [p, ec] = std::from_chars(s.data(), s.data() + s.size(), v);
    if (ec != std::errc{} || p != s.data() + s.size()) return std::nullopt;
    return v;
}

// Precedence: flags > environment > file > defaults.
// Returns the config, or a list of every problem found.
std::optional<Config> load(const std::map<std::string, std::string>& file,
                           const std::map<std::string, std::string>& env,
                           const std::map<std::string, std::string>& flags,
                           std::vector<std::string>& errors) {
    Config c;
    auto lookup = [&](std::string_view key) -> std::optional<std::string> {
        if (auto i = flags.find(std::string{key}); i != flags.end()) return i->second;
        if (auto i = env.find(std::string{key});   i != env.end())   return i->second;
        if (auto i = file.find(std::string{key});  i != file.end())  return i->second;
        return std::nullopt;
    };

    if (auto v = lookup("host")) c.host = *v;

    if (auto v = lookup("port")) {
        auto n = parseLong(*v);
        if (!n || *n < 1 || *n > 65535) errors.push_back("port must be 1-65535, got '" + *v + "'");
        else c.port = static_cast<std::uint16_t>(*n);
    }
    if (auto v = lookup("timeout_ms")) {
        auto n = parseLong(*v);
        if (!n || *n <= 0) errors.push_back("timeout_ms must be positive, got '" + *v + "'");
        else c.timeout = std::chrono::milliseconds{*n};
    }
    if (auto v = lookup("workers")) {
        auto n = parseLong(*v);
        if (!n || *n < 1 || *n > 1024) errors.push_back("workers must be 1-1024, got '" + *v + "'");
        else c.workers = static_cast<int>(*n);
    }
    if (auto v = lookup("log_level")) {
        auto l = parseLevel(*v);
        if (!l) errors.push_back("log_level must be trace|debug|info|warn|error, got '" + *v + "'");
        else c.logLevel = *l;
    }
    if (auto v = lookup("db_password")) c.dbPassword = *v;

    if (!errors.empty()) return std::nullopt;
    return c;
}

int main() {
    std::map<std::string, std::string> file{
        {"host", "127.0.0.1"}, {"port", "9000"}, {"workers", "8"},
        {"db_password", "hunter2"}};
    std::map<std::string, std::string> env{{"port", "9100"}};
    std::map<std::string, std::string> flags{{"log_level", "debug"}};

    std::vector<std::string> errors;
    if (auto c = load(file, env, flags, errors)) {
        std::cout << "resolved: " << c->describe() << '\\n';
        std::cout << "  (port 9100 from env beat 9000 from the file)\\n";
    }

    std::cout << "\\nnow with bad values:\\n";
    errors.clear();
    std::map<std::string, std::string> bad{
        {"port", "99999"}, {"workers", "0"}, {"log_level", "verbose"}};
    if (!load({}, {}, bad, errors)) {
        for (const auto& e : errors) std::cout << "  config error: " << e << '\\n';
        std::cout << "  -> refuse to start, exit non-zero\\n";
    }
}`,
          output: `resolved: host=127.0.0.1 port=9100 timeout=5000ms workers=8 db_password=<redacted>
  (port 9100 from env beat 9000 from the file)

now with bad values:
  config error: port must be 1-65535, got '99999'
  config error: workers must be 1-1024, got '0'
  config error: log_level must be trace|debug|info|warn|error, got 'verbose'
  -> refuse to start, exit non-zero`,
          explanation:
            "**Every problem is reported at once, not one per restart.** Collecting into an `errors` vector rather than returning on the first failure means an operator fixes three things in one pass — a small change that matters a great deal at 3am. Note `describe()` printing `<redacted>` for the password: that function is the only sanctioned way to log the config, and having it means nobody writes an ad-hoc dump that leaks the secret. And the precedence is visible in one place, in `lookup`, rather than scattered across the parse.",
        },
      ],
    },
    {
      id: "logging",
      heading: "Structured logging",
      body: [
        "**A log line is an event with fields, not a sentence.** `log(\"user \" + id + \" denied access to \" + path)` produces text a human can read and a machine cannot query — and the first thing anyone does in an incident is query.",
        "**Structured logging emits key–value pairs**, usually as JSON: `{\"level\":\"WARN\",\"msg\":\"access denied\",\"user_id\":7,\"path\":\"/admin\"}`. Now \"every denial for user 7 in the last hour\" is a query rather than a regular expression.",
        "**Keep the message constant and put the variables in fields.** That way the message is a stable identifier you can group by. `msg=\"access denied\"` with varying fields aggregates; `msg=\"user 7 denied /admin\"` has cardinality equal to your traffic.",
        "**Levels should mean something operationally, not describe how the author felt.** `ERROR`: something failed that needs human attention. `WARN`: something unexpected that the system handled. `INFO`: a significant state change — started, stopped, connected, config loaded. `DEBUG` and `TRACE`: for developers, off in production.",
        "**Make the check cheap and put it first**, so a disabled level costs a comparison rather than a string format. The example below builds nothing until the destructor confirms the level is enabled.",
        "**Include context automatically.** `std::source_location` (C++20) gives file, line and function with no macro, and a request or trace ID threaded through the call gives you the ability to reconstruct one request from interleaved logs.",
      ],
      examples: [
        {
          id: "structured-log",
          title: "Structured events with automatic source location",
          lang: "cpp",
          code: `#include <atomic>
#include <iostream>
#include <map>
#include <mutex>
#include <source_location>
#include <sstream>
#include <string>
#include <string_view>

enum class Level { Trace, Debug, Info, Warn, Error };
constexpr std::string_view name(Level l) {
    switch (l) {
        case Level::Trace: return "TRACE"; case Level::Debug: return "DEBUG";
        case Level::Info:  return "INFO";  case Level::Warn:  return "WARN";
        case Level::Error: return "ERROR";
    }
    return "?";
}

// Fields are attached with .with(); the record emits on destruction.
class LogRecord {
public:
    LogRecord(Level lvl, std::string_view msg,
              std::source_location loc = std::source_location::current())
        : level_{lvl}, msg_{msg}, loc_{loc} {}

    template <typename T>
    LogRecord& with(std::string_view key, const T& value) {
        std::ostringstream os; os << value;
        fields_.emplace(std::string{key}, os.str());
        return *this;
    }

    ~LogRecord() {
        if (level_ < minLevel()) return;          // disabled: emit nothing
        std::ostringstream os;
        os << '{' << "\\"level\\":\\"" << name(level_) << "\\""
           << ",\\"msg\\":\\"" << msg_ << "\\""
           << ",\\"src\\":\\"" << loc_.function_name() << ':' << loc_.line() << "\\"";
        for (const auto& [k, v] : fields_) os << ",\\"" << k << "\\":\\"" << v << "\\"";
        os << '}';
        std::lock_guard lk{mutex()};
        std::cout << os.str() << '\\n';
    }

    static Level& minLevel() { static Level l = Level::Info; return l; }

private:
    static std::mutex& mutex() { static std::mutex m; return m; }
    Level                              level_;
    std::string                        msg_;
    std::source_location               loc_;
    std::map<std::string, std::string> fields_;
};

#define LOG(lvl, msg) LogRecord(lvl, msg)

struct Metrics {
    static std::atomic<long>& counter(const std::string& n) {
        static std::mutex m; static std::map<std::string, std::atomic<long>> c;
        std::lock_guard lk{m};
        return c[n];
    }
};

int handleRequest(std::string_view path, int userId) {
    Metrics::counter("requests_total")++;
    LOG(Level::Info, "request received").with("path", path).with("user_id", userId);

    if (path == "/admin" && userId != 1) {
        Metrics::counter("requests_denied")++;
        LOG(Level::Warn, "access denied").with("path", path).with("user_id", userId);
        return 403;
    }
    LOG(Level::Debug, "this is below the threshold and costs almost nothing");
    return 200;
}

int main() {
    handleRequest("/health", 7);
    handleRequest("/admin", 7);
    handleRequest("/admin", 1);
    std::cout << "requests_total  = " << Metrics::counter("requests_total").load() << '\\n';
    std::cout << "requests_denied = " << Metrics::counter("requests_denied").load() << '\\n';
}`,
          output: `{"level":"INFO","msg":"request received","src":"int handleRequest(std::string_view, int):70","path":"/health","user_id":"7"}
{"level":"INFO","msg":"request received","src":"int handleRequest(std::string_view, int):70","path":"/admin","user_id":"7"}
{"level":"WARN","msg":"access denied","src":"int handleRequest(std::string_view, int):73","path":"/admin","user_id":"7"}
{"level":"INFO","msg":"request received","src":"int handleRequest(std::string_view, int):70","path":"/admin","user_id":"1"}
requests_total  = 3
requests_denied = 1`,
          explanation:
            "**The `msg` is constant and the varying data is in fields**, so `msg=\"access denied\"` aggregates across all denials while `user_id` and `path` remain queryable. The `DEBUG` line never appeared and never built a string, because the level check happens in the destructor before any formatting. And `std::source_location::current()` as a defaulted parameter captured the calling function and line with no macro — the caller wrote `LOG(Level::Warn, \"access denied\")` and got `handleRequest:73` attached automatically.",
        },
      ],
      pitfalls: [
        {
          title: "Logging inside a lock, or on the hot path, is how logging becomes the bottleneck",
          body: "A log call that formats a string, acquires a global mutex and writes to a file is easily microseconds — fine once per request, ruinous inside a loop or while holding a lock other threads are waiting on. The fixes: check the level before formatting, which the example does by deferring to the destructor; never log while holding an unrelated lock, since you have now serialised on I/O; and for anything genuinely hot, hand the formatted record to a background thread through a queue rather than writing inline. Also beware unbounded log volume — a per-iteration `DEBUG` line in a million-iteration loop fills a disk, and rate limiting or sampling is the answer.",
        },
      ],
    },
    {
      id: "three-signals",
      heading: "Logs, metrics and traces",
      body: [
        "The three signals answer different questions, and a system with only one is hard to operate.",
        "**Metrics answer \"is it healthy, and how much?\"** — counters, gauges and histograms, aggregated and cheap. Request rate, error rate, latency percentiles, queue depth, memory in use. They are what alerts fire on, because they are numeric, continuous and low-volume. **They cannot tell you about one specific request.**",
        "**Logs answer \"what happened in this particular case?\"** — discrete events with detail. They are what you read once an alert has fired and you need specifics. High volume, expensive to store, invaluable when you need them.",
        "**Traces answer \"where did the time go across services?\"** — one request's path through a distributed system with timing per span. They are how you find that the 900ms is one downstream call, which neither a metric nor a log will tell you.",
        "**The rule of thumb: alert on metrics, diagnose with traces, confirm with logs.**",
        "**Instrument the four signals that matter for almost any service** — the RED method: **R**ate, **E**rrors, **D**uration, plus saturation of whatever resource is scarcest. If you add nothing else, add those.",
        "**Keep it cheap enough to leave on.** An atomic counter increment is a few nanoseconds; sampling a histogram is tens. Instrumentation that must be disabled in production is instrumentation you will not have when you need it.",
      ],
      examples: [
        {
          id: "metrics",
          title: "Counters, a latency histogram, and a scope timer",
          lang: "cpp",
          code: `#include <array>
#include <atomic>
#include <chrono>
#include <cstdio>
#include <string>
#include <thread>

// A latency histogram with fixed buckets: no allocation, no lock,
// cheap enough to leave enabled in production.
class Histogram {
public:
    void observe(double ms) {
        count_.fetch_add(1, std::memory_order_relaxed);
        // (a real implementation would use a proper float accumulator)
        totalMs_.fetch_add(static_cast<long>(ms * 1000), std::memory_order_relaxed);
        for (std::size_t i = 0; i < bounds_.size(); ++i)
            if (ms <= bounds_[i]) { buckets_[i].fetch_add(1, std::memory_order_relaxed); return; }
        overflow_.fetch_add(1, std::memory_order_relaxed);
    }

    void report(const char* name) const {
        long n = count_.load();
        std::printf("%s: count=%ld mean=%.2fms\\n", name, n,
                    n ? double(totalMs_.load()) / 1000.0 / double(n) : 0.0);
        for (std::size_t i = 0; i < bounds_.size(); ++i)
            std::printf("   <=%6.1fms : %ld\\n", bounds_[i], buckets_[i].load());
        std::printf("   >    max   : %ld\\n", overflow_.load());
    }

private:
    static constexpr std::array<double, 5> bounds_{1, 5, 10, 50, 100};
    std::array<std::atomic<long>, 5> buckets_{};
    std::atomic<long> overflow_{0}, count_{0}, totalMs_{0};
};

// RAII timer that feeds the histogram.
class Timed {
public:
    explicit Timed(Histogram& h) : h_{h}, t0_{std::chrono::steady_clock::now()} {}
    ~Timed() {
        h_.observe(std::chrono::duration<double, std::milli>(
                       std::chrono::steady_clock::now() - t0_).count());
    }
private:
    Histogram& h_;
    std::chrono::steady_clock::time_point t0_;
};

Histogram          requestLatency;
std::atomic<long>  requestsTotal{0}, requestsFailed{0};

bool handle(int i) {
    Timed t{requestLatency};
    requestsTotal.fetch_add(1, std::memory_order_relaxed);
    std::this_thread::sleep_for(std::chrono::milliseconds{i % 7});
    if (i % 5 == 0) { requestsFailed.fetch_add(1, std::memory_order_relaxed); return false; }
    return true;
}

int main() {
    for (int i = 0; i < 40; ++i) handle(i);

    std::printf("requests_total  = %ld\\n", requestsTotal.load());
    std::printf("requests_failed = %ld  (%.1f%% error rate)\\n",
                requestsFailed.load(),
                100.0 * double(requestsFailed.load()) / double(requestsTotal.load()));
    requestLatency.report("request_latency");
}`,
          output: `requests_total  = 40
requests_failed = 8  (20.0% error rate)
request_latency: count=40 mean=2.98ms
   <=   1.0ms : 6
   <=   5.0ms : 24
   <=  10.0ms : 10
   <=  50.0ms : 0
   <= 100.0ms : 0
   >    max   : 0

# The counts are exact; the bucket boundaries shift by one or two
# between runs because the work is a sleep.`,
          explanation:
            "**Rate, errors and duration, in about sixty lines and with no allocation on the measured path.** Every counter update is a relaxed atomic add — module 11 established that is the cheapest correct option for a counter nobody orders against — so this can stay enabled in production. The histogram uses fixed bucket bounds rather than storing samples, which is what real metrics systems do: you lose exact percentiles and gain the ability to aggregate across processes cheaply. `Timed` is the same RAII shape as the scope timer in module 13.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How should configuration be structured?",
      answer:
        "With a documented precedence — conventionally flags, then environment, then a config file, then compiled-in defaults — and validated completely at startup rather than at first use. Parse once into a typed struct with real types like `std::chrono::milliseconds` and `enum class`, so downstream code cannot re-parse or mis-key it and invalid values are impossible past startup. Collect *all* validation errors and report them together, so an operator fixes everything in one pass instead of one per restart. Provide a redacting `describe()` so the effective config can be logged without leaking secrets, and a way to dump it, which removes a whole class of \"why is it behaving like that\".",
    },
    {
      question: "What is structured logging and why does it matter?",
      answer:
        "Emitting each log entry as an event with key–value fields, usually JSON, rather than an interpolated sentence. `{\"msg\":\"access denied\",\"user_id\":7,\"path\":\"/admin\"}` can be queried — \"all denials for user 7 in the last hour\" is a filter rather than a regular expression. The critical discipline is keeping the message *constant* and putting variables in fields: `msg=\"access denied\"` aggregates across all occurrences, while `msg=\"user 7 denied /admin\"` has cardinality equal to your traffic and groups into nothing. Adding `std::source_location` as a defaulted parameter attaches file, line and function with no macro.",
    },
    {
      question: "What should each log level mean?",
      answer:
        "Something operational, not how the author felt. `ERROR`: something failed that needs human attention — it should be rare enough that someone reads every one. `WARN`: something unexpected that the system handled itself. `INFO`: a significant state change — started, stopped, connected, configuration loaded. `DEBUG` and `TRACE`: developer detail, off in production. The test for `ERROR` is whether you would want to be paged for it; if not, it is a `WARN`. Levels that do not mean anything operationally produce logs nobody reads, which is the same as having none.",
    },
    {
      question: "What is the difference between logs, metrics and traces?",
      answer:
        "They answer different questions. Metrics — counters, gauges, histograms — answer \"is it healthy and how much\": cheap, aggregated, low volume, and what alerts fire on, but they cannot tell you about one specific request. Logs answer \"what happened in this particular case\": discrete events with detail, high volume, expensive to store, and what you read after an alert fires. Traces answer \"where did the time go across services\": one request's path through a distributed system with per-span timing, which finds the 900ms downstream call that neither of the others reveals. The rule is alert on metrics, diagnose with traces, confirm with logs.",
    },
    {
      question: "How do you keep instrumentation cheap enough to leave enabled?",
      answer:
        "Use relaxed atomics for counters — a few nanoseconds, and module 11 established relaxed is correct when nothing orders against the counter. Use fixed-bucket histograms rather than storing samples, which is what real metrics systems do: you trade exact percentiles for cheap aggregation and no allocation. For logging, check the level *before* formatting, so a disabled `DEBUG` line costs a comparison rather than a string build. Never log while holding an unrelated lock, since that serialises every waiting thread on I/O, and for genuinely hot paths hand the record to a background writer through a queue. Instrumentation that has to be disabled in production is instrumentation you will not have when you need it.",
    },
    {
      question: "Why validate configuration at startup rather than on use?",
      answer:
        "Because a process that starts successfully and fails forty minutes later on a malformed timeout is far worse to operate than one that refuses to start. Startup validation makes the failure immediate, attributable and safe — nothing has been half-done. It also means the rest of the program can assume validity: past the parse boundary, a `Config` holds a `std::chrono::milliseconds` that is known positive and a port known to be in range, so no downstream code needs a check. That is the same \"make invalid states unrepresentable\" move from lesson 1, applied to the program's inputs.",
    },
  ],
  takeaways: [
    "Configuration is untrusted input: parse once, validate fully, produce a typed object",
    "Document the precedence — flags, environment, file, defaults",
    "Collect every validation error and report them together, then exit non-zero",
    "Give the config a redacting `describe()` and never log secrets any other way",
    "A log entry is an event with fields, not a sentence",
    "Keep `msg` constant and put variables in fields, or the cardinality destroys aggregation",
    "Levels are operational: `ERROR` means someone must look",
    "Check the level before formatting, so disabled logs cost a comparison",
    "`std::source_location` attaches file, line and function with no macro",
    "Never log while holding an unrelated lock — you have serialised on I/O",
    "Metrics: is it healthy. Logs: what happened here. Traces: where did the time go",
    "Alert on metrics, diagnose with traces, confirm with logs",
    "Instrument rate, errors, duration and saturation before anything else",
    "Relaxed atomic counters and fixed-bucket histograms are cheap enough to leave on",
  ],
  status: "available",
};
