import type { Lesson } from "@/content/types";

export const readingReviewingLesson: Lesson = {
  id: "cpp-reading-reviewing",
  slug: "reading-reviewing-and-interviewing",
  moduleSlug: "production-cpp",
  title: "Reading Unfamiliar C++, Reviewing It Well & the Questions That Separate Familiarity from Fluency",
  summary:
    "The skills that are not writing code. How to get oriented in a codebase you did not write, a review checklist ordered by what actually causes incidents, and the interview questions whose answers reveal whether someone has understood C++ or memorised it.",
  estimatedMinutes: 40,
  objectives: [
    "Orient yourself in an unfamiliar codebase efficiently",
    "Read dense C++ by decomposing rather than parsing linearly",
    "Review with a checklist ordered by consequence",
    "Give review feedback that changes the code rather than the mood",
    "Recognise the questions that distinguish depth from familiarity",
  ],
  sections: [
    {
      id: "reading",
      heading: "Reading a codebase you did not write",
      body: [
        "**Start with the build, not the code.** `CMakeLists.txt` names the components and their dependencies, which is the architecture — module 12 lesson 1 argued that layering belongs in `target_link_libraries`, and the corollary is that reading it tells you the layering. A dependency graph you can draw in five minutes is worth an hour of reading source files.",
        "**Then the public headers.** `include/` is the interface; `src/` is detail. Read the types before the functions and the invariants before the algorithms — a class's private members and its constructor tell you more about what it is for than its method bodies.",
        "**Then the tests.** Tests are executable documentation of what the authors believed the code should do, and unlike comments they cannot be silently wrong. When a function's purpose is unclear, its test usually states it.",
        "**Then find `main` and follow one path all the way through.** One complete trace — request arrives, gets parsed, dispatched, handled, responded to — is worth more than reading ten files in isolation, because it shows you how the pieces are actually wired.",
        "**Use tools rather than grep where you can.** `compile_commands.json` plus clangd gives you go-to-definition, find-references and type-on-hover, which is transformative in a codebase using templates. `clang-uml` or Doxygen's graphs render the include structure. Module 12 lesson 1's `CMAKE_EXPORT_COMPILE_COMMANDS` is what enables all of it.",
        "**And read the git history for the parts that confuse you.** `git log -p --follow` on a strange function, and `git blame` to find the commit message, usually explains the thing that looks wrong — it is frequently a fix for a bug you have not thought of.",
      ],
      examples: [
        {
          id: "decomposing",
          title: "Decomposing a dense declaration",
          lang: "cpp",
          code: `// The kind of line that stops people, from a real-shaped codebase:

template <typename Range, typename Proj = std::identity,
          typename Comp = std::ranges::less>
    requires std::sortable<std::ranges::iterator_t<Range>, Comp, Proj>
[[nodiscard]] constexpr auto
topN(Range&& r, std::size_t n, Comp comp = {}, Proj proj = {})
    -> std::vector<std::ranges::range_value_t<Range>>;


// ── Read it in this order, not left to right ─────────────────────
//
// 1. NAME and what it returns:
//        topN(...) -> std::vector<range_value_t<Range>>
//    "returns a vector of whatever the range holds". Now you know
//    roughly what it does before decoding anything else.
//
// 2. The RUNTIME parameters, ignoring the template ones:
//        (Range&& r, std::size_t n, Comp comp = {}, Proj proj = {})
//    a range, a count, and two defaulted callables. So: the top n.
//
// 3. The CONSTRAINT, which is the documentation:
//        requires std::sortable<iterator_t<Range>, Comp, Proj>
//    the range must be sortable with that comparator and projection.
//    Module 7 lesson 6: a concept is a named, checkable precondition.
//
// 4. The DEFAULTS, which tell you the common case:
//        Proj = std::identity, Comp = std::ranges::less
//    so topN(v, 3) means "the 3 smallest, comparing elements directly".
//
// 5. The ATTRIBUTES last:
//        [[nodiscard]] -- ignoring the result is a warning
//        constexpr     -- usable at compile time


// ── Three habits that make dense code readable ───────────────────
//
// A. Name the intermediate types.
using Iter  = std::ranges::iterator_t<Range>;
using Value = std::ranges::range_value_t<Range>;
// Now the signature reads in terms of Iter and Value.
//
// B. When deduction confuses you, make the compiler tell you.
template <typename> struct WhatIs;      // declared, never defined
// WhatIs<decltype(x)> probe;           // the ERROR names the type
//
// C. For a template you cannot follow, instantiate it mentally with
//    ONE concrete type. 'Range = std::vector<int>' turns the whole
//    signature into:
//        std::vector<int> topN(std::vector<int>&&, size_t,
//                              ranges::less, identity);
//    which is obvious. Generalise afterwards.`,
          output: `# The general rule for dense C++:
#
#   read the NAME, then the RETURN, then the RUNTIME PARAMETERS,
#   then the CONSTRAINTS, then the template machinery.
#
# Almost nobody reads it left to right, and the ones who appear to
# are pattern-matching shapes they have seen before.`,
          explanation:
            "**Substituting one concrete type is the single most useful technique.** `Range = std::vector<int>` collapses the whole declaration into an ordinary function signature you can read at a glance, and the generality can be recovered afterwards. The `WhatIs<T>` trick from module 7 lesson 1 is the other one worth keeping: when you cannot work out what a deduced type is, declaring an incomplete template and instantiating it makes the compiler print the answer in the error message.",
        },
      ],
    },
    {
      id: "reviewing",
      heading: "Reviewing",
      body: [
        "**Order the checklist by consequence, not by convenience.** Style is the easiest thing to comment on and the least important; the things that cause incidents are harder to see and are what review is for. Formatting should be `clang-format`'s job and should never appear in a human review.",
        "**First: lifetime and ownership.** Who owns this? Can this reference outlive its referent? Does a `string_view` or `span` parameter get stored? Is a lambda capturing by reference and escaping its scope? Modules 8 and 9 measured every one of these failing silently.",
        "**Second: error handling.** What happens when this fails? Is a return value ignored — and is it `[[nodiscard]]`? Is the object left in a valid state if this throws? Does a `catch` swallow something it should not?",
        "**Third: concurrency.** What protects this shared state? Is the invariant spanning two members covered by one lock? Are two locks ever taken in different orders? Is a callback invoked while holding a lock?",
        "**Fourth: correctness of the edge cases** — empty containers, zero, negative, maximum values, self-assignment, and the boundary of every loop.",
        "**Then interface design, then performance, then naming.** Performance is deliberately low: without a profile it is speculation, and module 13 lesson 4 argued that speculative optimisation makes code worse.",
        "**And review the tests as code.** A test that cannot fail is worse than no test, because it looks like coverage.",
      ],
      examples: [
        {
          id: "review-example",
          title: "A review, ordered by consequence",
          lang: "cpp",
          code: `// ═══ The change under review ═══════════════════════════════════
class SessionCache {
public:
    void add(std::string_view key, const Session& s) {
        cache_[key] = s;                                        // (1)
    }

    const Session* find(std::string_view key) {                 // (2)
        auto it = cache_.find(key);
        return it == cache_.end() ? nullptr : &it->second;      // (3)
    }

    void expireAll(std::function<void(const Session&)> onExpire) {
        std::lock_guard lk{mutex_};
        for (auto& [k, s] : cache_) onExpire(s);                // (4)
        cache_.clear();
    }

    size_t size() { return cache_.size(); }                     // (5)

private:
    std::mutex mutex_;
    std::map<std::string_view, Session> cache_;                 // (6)
};


// ═══ The review, ordered by what causes incidents ══════════════
//
// LIFETIME  (6) and (1) -- the serious one.
//   The key type is string_view, so the map stores a NON-OWNING view
//   of the caller's string. add("temp-key", s) with a temporary, or
//   with a std::string that later goes out of scope, leaves a
//   dangling key -- and comparisons then read freed memory.
//   -> the map key must be std::string. This is module 8 lesson 6.
//
// LIFETIME  (3)
//   find() returns a raw pointer into the map. Any later insert on a
//   std::map is fine, but an erase or clear invalidates it, and the
//   caller has no way to know. Return a copy, or a shared_ptr, or
//   document the lifetime explicitly.
//
// CONCURRENCY  (1), (2), (5)
//   expireAll locks; add, find and size do not. So the mutex protects
//   nothing -- a concurrent add during expireAll is a data race on the
//   map. Either lock every accessor or document it as unsynchronised.
//   Module 11 lesson 2: this is UB, not "probably fine".
//
// CONCURRENCY  (4) -- the subtle one.
//   onExpire is a caller-supplied callback invoked while holding
//   mutex_. If it calls back into this cache, self-deadlock; if it
//   takes another lock that someone else holds while waiting for
//   ours, a lock-order inversion. Module 11 lesson 3.
//   -> move the entries out under the lock, release it, then call.
//
// CONST-CORRECTNESS  (2), (5)
//   find() and size() do not modify and should be const, with mutex_
//   marked mutable. As written, a const SessionCache& is useless.
//
// INTERFACE
//   add() takes 'const Session&' and copies; consider by-value + move.
//   size() returning size_t rather than std::size_t is a portability nit.
//
// (No comments on formatting -- clang-format owns that.)`,
          output: `# The ordering is the point. A reviewer who leads with
#   "prefer size_t to unsigned" and misses the dangling string_view key
# has spent their credibility on the wrong line.
#
# Say the serious thing first, say it plainly, and be explicit about
# which comments block the merge and which are suggestions.`,
          explanation:
            "**The `std::map<std::string_view, Session>` is the bug that would reach production.** It compiles, it passes any test that uses string literals — which have static storage duration and therefore never dangle — and it fails when a caller passes a `std::string` that goes out of scope. That is precisely module 8 lesson 6's warning, and it is invisible unless you are specifically looking at ownership. The callback-under-lock at (4) is the other one worth training yourself to spot: it is correct today and becomes a deadlock when someone writes a handler that touches the cache.",
        },
      ],
      pitfalls: [
        {
          title: "Review comments that change behaviour and comments that change nothing look identical",
          body: "A list of fifteen comments where two are correctness bugs and thirteen are preferences reads as fifteen equal objections, and the author fixes the easy ones first. Label them: `blocking:` for anything that must change before merge, `suggestion:` for improvements, `nit:` for trivia, and `question:` when you genuinely do not know. It costs one word and it tells the author what to do. Also: ask rather than assert when you are not sure — \"what happens if `cache_` is cleared while a caller holds this pointer?\" invites the author to think, where \"this is wrong\" invites them to defend. The goal is better code, and being right in a way nobody acts on achieves nothing.",
        },
      ],
    },
    {
      id: "interviewing",
      heading: "The questions that separate familiarity from fluency",
      body: [
        "This track carries interview questions in every lesson. This section is about the *shape* of the questions that discriminate, from either side of the table.",
        "**A question that tests recall has one fact as its answer** — \"what does `virtual` do?\" — and is answered as well by someone who read a blog post yesterday as by someone with five years of experience.",
        "**A question that tests understanding asks *why*, or asks for a trade-off.** \"Why does `vector` need your move constructor to be `noexcept`?\" cannot be answered without understanding both the strong exception guarantee and what a failed reallocation would leave behind. Module 10 lesson 4 measured the consequence: one keyword turning every element move into a copy.",
        "**The best questions are ones where the naive answer is wrong.** \"Is a lambda slower than a function pointer?\" — most say yes; the answer is usually the opposite, because a lambda's unique closure type lets the call inline while a function pointer usually cannot. \"Does making a class's members atomic make it thread-safe?\" — no, because atomics do not compose.",
        "**Ask what they have actually debugged.** \"Tell me about a memory bug you found and how\" reveals whether someone has used a sanitizer, read a stack trace, or bisected a regression — and it cannot be prepared for in the way a definition can.",
        "**And be suspicious of confident answers to genuinely uncertain questions.** \"Which is faster?\" almost always deserves \"it depends, and I would measure\" — module 13 lesson 4's whole argument. Someone who answers a performance question with a number and no caveat is telling you they have not measured.",
      ],
      examples: [
        {
          id: "discriminating-questions",
          title: "Ten questions where the naive answer is wrong",
          lang: "cpp",
          code: `// Each of these has a plausible wrong answer that most people give.
// The module where this track establishes the real answer is noted.

// 1. Is a lambda slower than a function pointer?          [m9 L3]
//    Naive: yes, it is an object.
//    Real:  usually FASTER -- the unique closure type lets the call
//           inline; a function pointer is a runtime value that
//           usually cannot be.

// 2. Does making every member atomic make a class thread-safe? [m11 L6]
//    Naive: yes.
//    Real:  no. Atomics do not compose -- an invariant spanning two
//           members can still be observed half-updated.

// 3. Why must a move constructor be noexcept?              [m10 L4]
//    Naive: it is good practice.
//    Real:  vector's reallocation MOVES only if the move is noexcept,
//           and COPIES otherwise, to preserve the strong guarantee.
//           One keyword changes every growth from moves to copies.

// 4. Is std::vector<bool> a vector of bool?                [m8 L3]
//    Naive: yes.
//    Real:  no -- a bit-packed specialisation whose operator[] returns
//           a proxy, so 'auto b = v[0]' aliases rather than copies.

// 5. Does 'const' on a member function make it thread-safe? [m11 L2]
//    Naive: yes, it does not modify.
//    Real:  no. It promises not to modify through THAT reference;
//           another thread may hold a non-const one. It is a
//           convention that const means thread-safe, not a guarantee.

// 6. What does 'inline' do?                                [m13 L6]
//    Naive: asks the compiler to inline.
//    Real:  permits multiple definitions across TUs. It is barely a
//           hint about inlining, which is decided on size and
//           call frequency.

// 7. Is a data race just a torn value?                     [m11 L2]
//    Naive: worst case you read a half-written number.
//    Real:  undefined behaviour with no bounded worst case -- a racy
//           loop can become infinite because the load was hoisted.

// 8. Should you always pass shared_ptr by const&?          [m9 L2]
//    Naive: no, pass by value, it is only a pointer.
//    Real:  by value costs an atomic increment AND decrement.
//           Measured 210 ms vs 0 ms over 20M calls. Pass by value
//           only when the function STORES it.

// 9. Does RVO mean returning by value is free?             [m5, m14 L1]
//    Naive: the compiler elides it, so yes always.
//    Real:  guaranteed only for a prvalue; returning a named local is
//           NRVO, which is permitted but not guaranteed. Still the
//           right default -- but not a guarantee you can rely on.

// 10. Which container is fastest for lookups?              [m8 L3]
//     Naive: unordered_map, it is O(1).
//     Real:  measured ~2x over map for 100k string keys, not orders of
//            magnitude -- and for small n a sorted vector beats both,
//            because O() says nothing about constants or locality.`,
          output: `# What the answers have in common:
#
#   every one requires knowing WHY the language behaves as it does,
#   and every naive answer is what you get from knowing the syntax.
#
# The same list works as a self-test. If you can explain the
# mechanism behind all ten, you have understood this track.`,
          explanation:
            "**Every one of these has been measured somewhere in this track**, which is the point: they are not trivia, they are the places where the obvious model of C++ is wrong and the consequences are real. Question 3 in particular is the one that most reliably separates people — the answer requires connecting move semantics, the strong exception guarantee, and what `vector` does during reallocation, which are three separate topics that only make sense together.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you get oriented in an unfamiliar C++ codebase?",
      answer:
        "Start with the build files: `CMakeLists.txt` names the components and their dependency edges, which is the architecture, and it takes minutes rather than the hour that reading source files would. Then the public headers, since `include/` is the interface and `src/` is detail — read types and invariants before algorithms. Then the tests, which are executable documentation that cannot be silently wrong the way comments can. Then find `main` and trace one complete path end to end, which shows how the pieces are actually wired. Enable `CMAKE_EXPORT_COMPILE_COMMANDS` so clangd gives you go-to-definition and find-references, and use `git log -p` and `git blame` on anything that looks wrong — it is often a fix for a bug you have not considered.",
    },
    {
      question: "How do you read a dense template declaration?",
      answer:
        "Not left to right. Read the name and the return type first, so you know roughly what it does; then the runtime parameters, ignoring the template ones; then the `requires` clause, which is the documented precondition; then the defaults, which tell you the common case; and the attributes last. The single most effective technique is substituting one concrete type — mentally setting `Range = std::vector<int>` collapses a page of template machinery into an ordinary signature you can read at a glance, and the generality can be recovered afterwards. When a deduced type is unclear, declare an incomplete `template <typename> struct WhatIs;` and instantiate it, so the compiler prints the answer in the error.",
    },
    {
      question: "What should a C++ code review prioritise?",
      answer:
        "Consequence order, not convenience order. Lifetime and ownership first — who owns this, can a reference outlive its referent, is a `string_view` or `span` parameter being stored, is an escaping lambda capturing by reference. Then error handling: what happens on failure, is a return value ignored, is the object valid if this throws. Then concurrency: what protects the shared state, does one lock cover an invariant spanning two members, are locks ever taken in different orders, is a callback invoked under a lock. Then edge cases, then interface design, then performance — deliberately low, because without a profile it is speculation. Formatting should never appear; that is `clang-format`'s job.",
    },
    {
      question: "How do you give review feedback that actually improves the code?",
      answer:
        "Label severity, because fifteen comments where two are bugs and thirteen are preferences read as fifteen equal objections and the author fixes the easy ones first. Prefixing with `blocking:`, `suggestion:`, `nit:` and `question:` costs one word and tells the author what to do. Ask rather than assert when you are not certain — \"what happens if the cache is cleared while a caller holds this pointer?\" invites thought, where \"this is wrong\" invites defence. And explain the mechanism rather than citing a rule, since the author needs to be able to spot the same issue themselves next time. Being right in a way nobody acts on achieves nothing.",
    },
    {
      question: "What kind of interview question actually discriminates?",
      answer:
        "One where the naive answer is wrong and the right answer requires knowing *why* the language behaves as it does. \"What does `virtual` do\" is recall and is answered equally well by someone who read a blog post yesterday. \"Why must a move constructor be `noexcept`\" cannot be answered without connecting move semantics, the strong exception guarantee, and `vector`'s reallocation behaviour — three topics that only make sense together. Questions about trade-offs work for the same reason. Asking what someone has actually debugged reveals whether they have used a sanitizer or bisected a regression, which cannot be prepared for. And be suspicious of confident answers to \"which is faster\": the correct response is usually \"it depends, and I would measure\".",
    },
  ],
  takeaways: [
    "Read the build files first — they contain the architecture",
    "Then public headers, then tests, then one complete trace through `main`",
    "Tests are executable documentation and cannot be silently wrong the way comments can",
    "Enable `compile_commands.json` so clangd works; grep is a poor substitute in templated code",
    "`git blame` on code that looks wrong usually finds the bug it was fixing",
    "Read dense declarations name-first, then return, parameters, constraints, template machinery",
    "Substituting one concrete type collapses a template signature into a readable one",
    "Review in consequence order: lifetime, errors, concurrency, edge cases, design, performance",
    "Formatting belongs to `clang-format` and never to a human reviewer",
    "Label comments `blocking:`, `suggestion:`, `nit:`, `question:` so severity is visible",
    "Ask rather than assert when uncertain — the goal is better code, not being right",
    "Discriminating questions are ones where the naive answer is wrong",
    "\"Which is faster?\" deserves \"it depends, and I would measure\"",
  ],
  status: "available",
};
