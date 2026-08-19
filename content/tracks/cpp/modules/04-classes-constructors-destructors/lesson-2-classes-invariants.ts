import type { Lesson } from "@/content/types";

export const classesInvariantsLesson: Lesson = {
  id: "cpp-classes-invariants",
  slug: "classes-and-invariants",
  moduleSlug: "classes-constructors-destructors",
  title: "From Struct to Class: Invariants & Encapsulation",
  summary:
    "What a class is actually for. An invariant is something that must always be true of an object's state; access control is how the type guarantees it — and the guarantee is what makes a type worth writing.",
  estimatedMinutes: 30,
  objectives: [
    "Define an invariant and identify one in a real type",
    "Use `public`, `private` and `protected` deliberately",
    "Explain why a constructor is the only place an invariant can be established",
    "Design an interface around operations rather than around data",
    "Recognise a getter-and-setter class that has no invariant at all",
  ],
  sections: [
    {
      id: "invariant",
      heading: "What an invariant is",
      body: [
        "**An invariant is a statement about an object's state that is true from the moment the object is constructed until it is destroyed.**",
        "Examples: a temperature is never below absolute zero. A `std::vector`'s `size` is never greater than its `capacity`. A date's `day` is valid for its `month`. A file handle is either open or null, never a stale value. A bank balance and its transaction log always agree.",
        "The point of a class is that **it can guarantee its invariant**, and the guarantee is what makes the type worth having. If any combination of member values is acceptable, you have a `struct` and nothing is being protected.",
        "Two things are needed for a guarantee, and both are necessary.",
        "**The constructor establishes it.** An object cannot exist in an invalid state, because the only way to create one is through a constructor that checks.",
        "**Every mutating operation preserves it.** Any function that changes the state re-establishes the invariant before returning, and the state cannot be changed any other way — which requires the data to be private.",
        "That second requirement is what access control is for. **Private members are not about secrecy; they are about being able to enumerate the code that can break your invariant.** If the data is public, that code is the whole program.",
      ],
      examples: [
        {
          id: "invariant-demo",
          title: "The same data, with and without a guarantee",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <string>

// A struct: no invariant. Any combination of values is allowed.
struct RawTemperature { double celsius; };

// A class: the invariant is "celsius >= -273.15", and it cannot be broken.
class Temperature {
public:
    explicit Temperature(double celsius) : celsius_(celsius) {
        if (celsius < kAbsoluteZero)
            throw std::invalid_argument("below absolute zero");
    }
    double celsius()    const { return celsius_; }
    double fahrenheit() const { return celsius_ * 9.0 / 5.0 + 32.0; }

    void set_celsius(double c) {
        if (c < kAbsoluteZero) throw std::invalid_argument("below absolute zero");
        celsius_ = c;
    }

private:
    static constexpr double kAbsoluteZero = -273.15;
    double celsius_;
};

int main() {
    RawTemperature bad{-500.0};           // nothing stops this
    std::cout << "raw accepts " << bad.celsius << '\\n';

    Temperature t{25.0};
    std::cout << t.celsius() << "C = " << t.fahrenheit() << "F\\n";

    try { Temperature impossible{-500.0}; }
    catch (const std::invalid_argument& e) { std::cout << "rejected: " << e.what() << '\\n'; }

    try { t.set_celsius(-400.0); }
    catch (const std::invalid_argument& e) { std::cout << "rejected: " << e.what() << '\\n'; }

    std::cout << "still valid: " << t.celsius() << '\\n';
}`,
          output: `raw accepts -500
25C = 77F
rejected: below absolute zero
rejected: below absolute zero
still valid: 25`,
          explanation:
            "**There is no way to obtain an invalid `Temperature`.** The constructor rejects it, the setter rejects it, and `celsius_` is private so no third route exists. Notice the last line: the failed `set_celsius` left the object unchanged rather than half-modified — that is the *strong exception guarantee*, and it comes free here because the check precedes the assignment. Module 10 covers what it takes when the operation is more complicated.",
        },
      ],
    },
    {
      id: "access",
      heading: "public, private and protected",
      body: [
        "**`public`** — accessible to anyone. This is the type's interface: the promises you are making and will have to keep.",
        "**`private`** — accessible only to the class's own member functions and its friends. This is the implementation: free to change without affecting any caller.",
        "**`protected`** — accessible to the class and to classes derived from it. Covered in module 6; the short version is that it is used far more often than it should be, because it exposes implementation to an unbounded set of future subclasses.",
        "A `class` is private by default and a `struct` public by default; there is no other difference. Sections can appear in any order and repeat.",
        "**Default to private.** Make a member public only when a caller genuinely needs it, because everything public is a promise. This is the reverse of how most people write their first class, and it is worth reversing deliberately.",
        "The trailing underscore on `celsius_` is a common convention for private data. It distinguishes members from locals and parameters, so `celsius_ = celsius` in a constructor is unambiguous. Other codebases use a leading `m_`. Any consistent choice is fine.",
      ],
      examples: [
        {
          id: "access-error",
          title: "What private actually enforces",
          lang: "cpp",
          code: `#include <iostream>

class Counter {
    int value_ = 0;          // private by default in a class
public:
    void bump() { ++value_; }
    int value() const { return value_; }
};

int main() {
    Counter c;
    c.bump();
    std::cout << c.value() << '\\n';
    // c.value_ = 100;       // ERROR
}`,
          output: `1

// Uncommenting the last line gives:
error: 'int Counter::value_' is private within this context
    7 | int main() { Counter c; c.value_ = 100; }
      |                           ^~~~~~
note: declared private here`,
          explanation:
            "**Access control is checked at compile time and costs nothing at runtime.** It is not a security mechanism — anyone can `#define private public` before the include, or reach the bytes through a cast — it is a *design* mechanism, letting you enumerate what can break an invariant. Note that access is per-*class*, not per-*object*: a member function of `Counter` can read another `Counter`'s privates, which is what makes comparison and copy operations possible.",
        },
      ],
    },
    {
      id: "interface-design",
      heading: "Design the interface around operations, not data",
      body: [
        "The most common mistake in a first class is to make every member private and then add a getter and a setter for each. This produces the same type as a public struct, but with more code — and no invariant is protected, because `set_x` accepts anything `x` could have held.",
        "**The question to ask is not \"what data does this hold?\" but \"what can you do with it?\"**",
        "A `BankAccount` does not want `set_balance`. It wants `deposit`, `withdraw` and `transfer` — operations that can enforce rules, record an audit entry, and reject an overdraft. Once those exist, the balance is derived state and needs no setter at all.",
        "This also decouples the interface from the representation. A `Rectangle` exposing `area()` can store width and height, or two corners, or a centre and extents, and change between them without breaking a single caller. One exposing `get_width()` and `get_height()` has published its representation and cannot.",
        "**A getter is fine when the value genuinely is part of the interface** — `size()` on a container, `name()` on a user. A *setter* is the one to be suspicious of, because it usually means the class has no rule to enforce and could have been a struct.",
      ],
      examples: [
        {
          id: "operations-not-data",
          title: "Two designs for the same object",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

// Anaemic: private data with a setter per field. Enforces nothing.
class AccountAnaemic {
public:
    double balance() const { return balance_; }
    void set_balance(double b) { balance_ = b; }   // accepts anything
private:
    double balance_ = 0;
};

// Designed around operations: the rules live where the state changes.
class Account {
public:
    explicit Account(std::string owner) : owner_(std::move(owner)) {}

    void deposit(double amount) {
        if (amount <= 0) throw std::invalid_argument("deposit must be positive");
        balance_ += amount;
        log_.push_back("deposit " + std::to_string(amount));
    }

    void withdraw(double amount) {
        if (amount <= 0)       throw std::invalid_argument("withdrawal must be positive");
        if (amount > balance_) throw std::runtime_error("insufficient funds");
        balance_ -= amount;
        log_.push_back("withdraw " + std::to_string(amount));
    }

    double balance() const { return balance_; }
    std::size_t entries() const { return log_.size(); }

private:
    std::string              owner_;
    double                   balance_ = 0;
    std::vector<std::string> log_;
};

int main() {
    AccountAnaemic weak;
    weak.set_balance(-1000);                     // nothing stops this
    std::cout << "anaemic balance: " << weak.balance() << '\\n';

    Account acct{"Ada"};
    acct.deposit(100);
    try { acct.withdraw(500); }
    catch (const std::exception& e) { std::cout << "rejected: " << e.what() << '\\n'; }
    acct.withdraw(30);

    std::cout << "balance " << acct.balance()
              << ", log entries " << acct.entries() << '\\n';
}`,
          output: `anaemic balance: -1000
rejected: insufficient funds
balance 70, log entries 2`,
          explanation:
            "**Two log entries, not three** — the rejected withdrawal changed nothing, because the checks come before any mutation. The anaemic version cannot do this at all: `set_balance` has no way to know whether it is a deposit or a correction, so it cannot validate or log. **Every rule the type enforces lives in a mutating operation, which is exactly why the operations are the interface.**",
        },
      ],
      pitfalls: [
        {
          title: "Returning a non-const reference to private data gives the invariant away",
          body: "`std::vector<std::string>& log() { return log_; }` makes the member private in name only — a caller can clear it, reorder it, or push entries that never happened. If callers need to read it, return `const std::vector<std::string>&`; if they need to iterate, expose `begin()`/`end()` or return a `std::span<const std::string>`. The rule: **a `const` reference out is a window, a non-`const` reference out is a hole.**",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a class invariant?",
      answer:
        "A statement about an object's state that holds from construction until destruction — a temperature never below absolute zero, a vector's size never exceeding its capacity, a date's day valid for its month. The purpose of a class is to guarantee one, which requires two things: a constructor that establishes it, so no invalid object can exist, and mutating operations that preserve it, with the data private so no other code can change the state. If any combination of member values is valid, there is no invariant and a struct is the right choice.",
    },
    {
      question: "Why make members private if `private` can be circumvented?",
      answer:
        "Because it is a design mechanism rather than a security one. Anyone determined can reinterpret the bytes or redefine the keyword before an include; that is not the point. The point is that private members let you *enumerate* the code capable of breaking your invariant — it is the class's own member functions and its friends, and nothing else. With public data that set is the entire program, and no guarantee about the object's state can be made or maintained. It is also checked entirely at compile time and costs nothing at runtime.",
    },
    {
      question: "What is wrong with a class that is just getters and setters?",
      answer:
        "It has the same semantics as a public struct with more code, and it protects nothing — `set_x` accepts anything `x` could have held, so there is no invariant. It also publishes the representation: a `Rectangle` exposing `get_width`/`get_height` cannot later switch to storing two corners, while one exposing `area()` can. The better question is not what data the object holds but what you can do with it. A getter is legitimate when the value is genuinely part of the interface; a setter usually means the type had no rule to enforce.",
    },
    {
      question: "What is the difference between `private` and `protected`?",
      answer:
        "`private` members are accessible only to the class's own member functions and friends. `protected` extends that to derived classes. In practice `protected` data is over-used: it exposes the representation to an unbounded set of future subclasses, so you can no longer change it freely, and it means the invariant must now be maintained by code you have not seen. `protected` member *functions* are more defensible, as a customisation point for subclasses. Prefer private data with a protected or virtual interface where derivation is intended.",
    },
    {
      question: "Why is returning a non-const reference to a private member a problem?",
      answer:
        "It hands out write access, so the member is private in name only — a caller can modify it in ways that break the invariant, bypassing every check in your mutating operations. If callers need read access, return a `const` reference; if they need to iterate, expose `begin()`/`end()` or a `std::span<const T>`. A const reference out is a window; a non-const reference out is a hole, and it is the most common way encapsulation is lost in practice.",
    },
  ],
  takeaways: [
    "An invariant is something always true of an object's state — the constructor establishes it and every mutator preserves it",
    "Private data is what makes the guarantee possible: it bounds the code that can break the invariant",
    "`class` and `struct` differ only in default access; choose by whether there is an invariant",
    "Access control is compile-time only, costs nothing, and is per-class rather than per-object",
    "Design the interface around operations — `deposit` and `withdraw`, not `set_balance`",
    "A getter can be part of the interface; a setter usually means the type had no rule to enforce",
    "Exposing operations rather than data lets you change the representation without breaking callers",
    "Return `const` references out of accessors — a non-const reference gives the invariant away",
  ],
  status: "available",
};
