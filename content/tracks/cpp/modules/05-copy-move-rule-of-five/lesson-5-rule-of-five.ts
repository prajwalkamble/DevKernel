import type { Lesson } from "@/content/types";

export const ruleOfFiveLesson: Lesson = {
  id: "cpp-rule-of-five",
  slug: "rule-of-zero-three-five",
  moduleSlug: "copy-move-rule-of-five",
  title: "The Rule of Zero, Three & Five",
  summary:
    "Which of the five special member functions you must write, and when. The generation rules are genuinely subtle — an empty destructor silently turns every move in your program into a copy — and the best answer is almost always to write none of them.",
  estimatedMinutes: 35,
  objectives: [
    "Name the five special member functions",
    "State the rule of three, the rule of five and the rule of zero",
    "Predict which operations the compiler generates given what you declared",
    "Demonstrate that declaring a destructor suppresses move generation",
    "Restructure a resource-owning class so the rule of zero applies",
  ],
  sections: [
    {
      id: "the-five",
      heading: "The five special member functions",
      body: [
        "Five functions govern an object's lifetime, and the compiler will supply any of them you do not.",
        "**The destructor** — `~T()`.",
        "**The copy constructor** — `T(const T&)`.",
        "**Copy assignment** — `T& operator=(const T&)`.",
        "**The move constructor** — `T(T&&)`.",
        "**Move assignment** — `T& operator=(T&&)`.",
        "(The default constructor is a sixth special function, but it is not part of these rules, because it is not about copying or destroying.)",
        "The rules that follow all answer one question: **if you write one of them, which others must you also write?**",
      ],
    },
    {
      id: "three-and-five",
      heading: "The rule of three, and the rule of five",
      body: [
        "**The rule of three** predates C++11: *if you need to write a destructor, a copy constructor, or copy assignment, you almost certainly need all three.*",
        "The reasoning is that all three exist for the same reason — the class manages a resource the compiler does not understand. A destructor implies ownership; ownership implies the generated member-wise copy is a shallow copy; a shallow copy implies a double free. Writing one and not the others is the single most reliable way to produce the bug from lesson 1.",
        "**The rule of five** is the C++11 update: the same logic extends to the two move operations. *If you write any of the five, consider all five.*",
        "Move operations are not required for correctness — a class with correct copy operations and no move operations works fine, it just copies where it could have moved. But since you are writing the others anyway, and moves are usually the cheapest of the five to implement, omitting them is leaving performance on the table for no reason.",
        "**The rule of five is a checklist, not a mandate.** Some of the five may legitimately be `= delete`. A non-copyable, movable type — which is the right shape for most resource wrappers — declares all five: destructor, both copies deleted, both moves defined.",
      ],
      examples: [
        {
          id: "five-forms",
          title: "The three shapes a resource-owning class takes",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <string>
#include <utility>

// 1. NON-COPYABLE, MOVABLE -- the right default for a unique resource.
class Connection {
public:
    explicit Connection(std::string host) : host_(std::move(host)) {}
    ~Connection() = default;

    Connection(const Connection&)            = delete;
    Connection& operator=(const Connection&) = delete;

    Connection(Connection&&) noexcept            = default;
    Connection& operator=(Connection&&) noexcept = default;

    const std::string& host() const { return host_; }
private:
    std::string host_;
};

// 2. NEITHER -- for a type whose identity matters, like a mutex or a scoped lock.
class ScopeGuard {
public:
    explicit ScopeGuard(std::string label) : label_(std::move(label)) {}
    ~ScopeGuard() { std::cout << "  released " << label_ << '\\n'; }

    ScopeGuard(const ScopeGuard&)            = delete;
    ScopeGuard& operator=(const ScopeGuard&) = delete;
    ScopeGuard(ScopeGuard&&)                 = delete;
    ScopeGuard& operator=(ScopeGuard&&)      = delete;
private:
    std::string label_;
};

// 3. BOTH -- a value type that owns something duplicable.
class Document {
public:
    explicit Document(std::string text)
        : text_(std::make_unique<std::string>(std::move(text))) {}

    ~Document() = default;
    Document(const Document& o) : text_(std::make_unique<std::string>(*o.text_)) {}
    Document& operator=(const Document& o) {
        if (this != &o) text_ = std::make_unique<std::string>(*o.text_);
        return *this;
    }
    Document(Document&&) noexcept            = default;
    Document& operator=(Document&&) noexcept = default;

    const std::string& text() const { return *text_; }
private:
    std::unique_ptr<std::string> text_;
};

int main() {
    Connection c{"db.internal"};
    Connection moved = std::move(c);
    std::cout << "moved connection: " << moved.host() << '\\n';

    { ScopeGuard g{"file lock"}; }

    Document a{"original"};
    Document b = a;                      // deep copy
    std::cout << "a: " << a.text() << "  b: " << b.text() << '\\n';
}`,
          output: `moved connection: db.internal
  released file lock
a: original  b: original`,
          explanation:
            "**Shape 1 is the one you will want most often.** Copying a connection, a file handle or a thread is meaningless, but moving it — transferring ownership — is useful, so delete the copies and default the moves. **Shape 2 suits anything whose identity is the point**: a scoped lock must not be movable, because the release must happen in the scope that acquired it. **Shape 3 is a value type**, where a copy means a genuinely independent duplicate, so the copy constructor deep-copies through the `unique_ptr`.",
        },
      ],
    },
    {
      id: "generation-rules",
      heading: "What the compiler generates, and when",
      body: [
        "These rules are the subtle part, and one of them causes a silent performance bug in real code.",
        "**The destructor** is generated unless you declare one.",
        "**The copy constructor and copy assignment** are generated unless you declare them. They are *deprecated* — but still generated — if you have declared a destructor or the other copy operation. That deprecation is the standard formally acknowledging the rule of three.",
        "**The move constructor and move assignment** are generated **only if you have declared none of: a destructor, either copy operation, or the other move operation.**",
        "That last rule is the trap. **Declaring a destructor — even an empty one, even `= default` — suppresses both move operations.** The class does not become non-movable, because `T obj = std::move(other);` still compiles: overload resolution falls back to the *copy* constructor, which is still generated. So the code builds, runs, produces correct results, and copies everywhere you expected a move.",
        "**There is no warning.** Nothing in `-Wall -Wextra` reports it, and you will only notice it in a profiler, or by testing as below.",
      ],
      examples: [
        {
          id: "destructor-kills-move",
          title: "An empty destructor, and every move becomes a copy",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <type_traits>
#include <utility>

struct WithDtor {
    std::string data;
    explicit WithDtor(std::string d) : data(std::move(d)) {}
    ~WithDtor() {}                    // harmless-looking, and it kills move generation
};

struct WithoutDtor {
    std::string data;
    explicit WithoutDtor(std::string d) : data(std::move(d)) {}
};

int main() {
    std::cout << std::boolalpha;
    std::cout << "WithDtor    move-constructible: "
              << std::is_move_constructible_v<WithDtor> << '\\n';
    std::cout << "WithDtor    nothrow-move:       "
              << std::is_nothrow_move_constructible_v<WithDtor> << '\\n';
    std::cout << "WithoutDtor nothrow-move:       "
              << std::is_nothrow_move_constructible_v<WithoutDtor> << '\\n';

    WithDtor a{"payload"};
    WithDtor b = std::move(a);        // compiles -- but it COPIED
    std::cout << "a.data after 'move': '" << a.data << "'\\n";

    WithoutDtor c{"payload"};
    WithoutDtor d = std::move(c);
    std::cout << "c.data after move:   '" << c.data << "'\\n";
}`,
          output: `WithDtor    move-constructible: true
WithDtor    nothrow-move:       false
WithoutDtor nothrow-move:       true
a.data after 'move': 'payload'
c.data after move:   ''`,
          explanation:
            "**`a.data` still holds `\"payload\"` after being \"moved\" from.** The source is untouched, which is proof the copy constructor ran. Meanwhile `c.data` is empty, so `WithoutDtor` genuinely moved. Note that `is_move_constructible_v<WithDtor>` is **`true`** — that trait asks whether `T obj = std::move(x)` compiles, and it does, via the copy. **`is_nothrow_move_constructible_v` is the trait that tells the truth**, and it is also exactly the one `std::vector` consults when deciding whether to move or copy during reallocation.",
        },
      ],
      pitfalls: [
        {
          title: "A virtual destructor triggers the same problem",
          body: "Module 6 will show that a base class intended for polymorphic deletion needs a `virtual ~Base() = default;`. That declaration suppresses move generation in the base and, transitively, affects derived classes. The fix is to declare all five explicitly whenever you declare a virtual destructor — `= default` on the moves is usually right — or to follow the C++ Core Guidelines rule of making polymorphic base classes non-copyable and non-movable, since slicing makes both dangerous anyway.",
        },
      ],
    },
    {
      id: "rule-of-zero",
      heading: "The rule of zero",
      body: [
        "Here is the conclusion the whole module has been building towards.",
        "**Design classes so that you declare none of the five.** If every member manages its own resource, the compiler-generated operations are all correct, all optimal, and all free — and every trap in the previous section becomes irrelevant, because you never trigger any of them.",
        "In practice this means: **do not hold raw owning pointers.** Hold a `std::string` instead of a `char*`, a `std::vector<T>` instead of a `T*` and a size, a `std::unique_ptr<T>` instead of a `T*` you `delete`, a `std::shared_ptr<T>` when ownership is genuinely shared, and a `std::fstream` instead of a `FILE*`.",
        "For a C resource with no standard wrapper, `std::unique_ptr<T, Deleter>` with a custom deleter — as in module 4 — gives you the rule of zero without writing a class at all.",
        "The payoff is not only that you write less code. **It is that the code you did not write cannot be wrong.** No self-assignment bug, no missing `noexcept`, no shallow copy, no forgotten move operation, and no destructor silently suppressing anything.",
        "The rule of five is for the small number of types that genuinely wrap a resource — and even then, the wrapper should be as small as possible so that everything *using* it can follow the rule of zero.",
      ],
      examples: [
        {
          id: "rule-of-zero-demo",
          title: "Five special functions, zero declared",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <string>
#include <utility>
#include <vector>

// Rule of zero: members manage themselves, so declare none of the five.
struct Profile {
    std::string              name;
    std::vector<std::string> tags;
    std::unique_ptr<int>     secret;   // move-only member makes Profile move-only
};

int main() {
    Profile a{"Ada", {"maths"}, std::make_unique<int>(42)};

    Profile b = std::move(a);          // move works: compiler-generated
    // Profile c = b;                  // ERROR: unique_ptr is not copyable

    std::cout << b.name << ' ' << b.tags.size() << ' ' << *b.secret << '\\n';
    std::cout << "a.name after move: '" << a.name << "'\\n";
}`,
          output: `Ada 1 42
a.name after move: ''`,
          explanation:
            "**Not one of the five is declared, and the behaviour is exactly right.** The move is generated and works. The copy is *implicitly deleted*, because `std::unique_ptr` is non-copyable and the compiler cannot generate a copy for a class containing one — so `Profile` inherited the correct copy policy from its members without a single `= delete`. That is the rule of zero doing real work: **the ownership policy of the whole is derived from the parts.**",
        },
      ],
    },
    {
      id: "checklist",
      heading: "The checklist",
      body: [
        "A short procedure for any new class.",
        "**Does it manage a resource directly — a raw pointer you `delete`, a handle you close, a lock you release?** If no, declare none of the five. You are done.",
        "**If yes: can you replace the raw resource with a standard type or a `unique_ptr` with a custom deleter?** Almost always yes. Do that, and you are back to declaring none of the five.",
        "**If you genuinely must manage it yourself**, declare all five and decide each one deliberately: is copying meaningful (define it) or meaningless (`= delete`)? Are the moves cheap (define them, `noexcept`) or is the type immovable by design (`= delete`)?",
        "**And if you declare a destructor for any reason** — including a virtual one, or one that just logs — remember that you have suppressed move generation, and declare the moves explicitly.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the rule of three, and why does it hold?",
      answer:
        "If you need to write a destructor, a copy constructor, or copy assignment, you almost certainly need all three — because all three exist for the same reason: the class manages a resource the compiler does not understand. A destructor implies ownership, ownership means the compiler's member-wise copy is a shallow copy, and a shallow copy means two objects free the same resource. Writing one without the others is the most reliable way to produce a double free. C++11 extended it to the rule of five by adding the two move operations.",
    },
    {
      question: "When does the compiler generate move operations?",
      answer:
        "Only when you have declared **none** of: a destructor, either copy operation, or the other move operation. Any one of those suppresses both moves. The copy operations, by contrast, are generated unless you declare them — they are merely deprecated if you declared a destructor or the other copy. That asymmetry is deliberate: a class that needed a destructor probably manages something, and silently generating a move for it would be more dangerous than silently generating a copy.",
    },
    {
      question: "What happens if you declare an empty destructor on a class with a `std::string` member?",
      answer:
        "Both move operations stop being generated, so every `std::move` of that type silently calls the copy constructor instead — the code compiles, runs and gives correct results while copying everywhere you expected a move. There is no warning under `-Wall -Wextra`. You can detect it: `std::is_nothrow_move_constructible_v<T>` becomes `false`, while `std::is_move_constructible_v<T>` stays `true` because the copy constructor satisfies it. The former is also exactly the trait `std::vector` checks when deciding whether to move or copy during reallocation.",
    },
    {
      question: "What is the rule of zero?",
      answer:
        "Design classes so you declare none of the five special members, by making every member manage its own resource — `std::string` rather than `char*`, `std::vector` rather than pointer-and-size, `std::unique_ptr` rather than a raw pointer you delete, and `unique_ptr` with a custom deleter for C handles. Then all five generated operations are correct and optimal, and none of the generation traps can be triggered. The deeper benefit is that the code you did not write cannot be wrong: no shallow copy, no self-assignment bug, no missing `noexcept`.",
    },
    {
      question: "How does a class containing a `std::unique_ptr` behave with respect to copying?",
      answer:
        "Its copy operations are implicitly deleted, because the compiler cannot generate a copy for a class containing a non-copyable member. Its move operations are still generated, so the class is move-only — it inherits the correct ownership policy from its member without any `= delete` written by hand. This is the rule of zero doing real work: the ownership semantics of the whole are derived from the parts, which is why choosing the right member types matters more than writing the right special members.",
    },
  ],
  takeaways: [
    "The five: destructor, copy constructor, copy assignment, move constructor, move assignment",
    "Rule of three: needing any one of destructor/copy-ctor/copy-assign means you need all three",
    "Rule of five: the same logic extended to the moves — it is a checklist, and `= delete` is a valid answer",
    "Moves are generated **only** if you declared no destructor, no copy operation and no other move",
    "**An empty or `= default` destructor silently turns every move into a copy**, with no warning",
    "`is_move_constructible_v` stays true in that case; `is_nothrow_move_constructible_v` is the honest trait",
    "Rule of zero: hold members that manage themselves and declare none of the five",
    "A `unique_ptr` member makes the whole class move-only automatically — policy inherited from the parts",
  ],
  status: "available",
};
