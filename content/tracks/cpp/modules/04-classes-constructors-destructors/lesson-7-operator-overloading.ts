import type { Lesson } from "@/content/types";

export const operatorOverloadingLesson: Lesson = {
  id: "cpp-operator-overloading",
  slug: "operator-overloading",
  moduleSlug: "classes-constructors-destructors",
  title: "Operator Overloading",
  summary:
    "Giving your own types the syntax of built-in ones. Which operators to define as members and which as free functions, the canonical `+=` then `+` pattern, `operator<<` for output, and the single rule that decides whether an overload is a good idea at all.",
  estimatedMinutes: 35,
  objectives: [
    "Decide whether an operator belongs as a member or a free function",
    "Implement arithmetic operators via their compound-assignment forms",
    "Write `operator<<` for stream output",
    "Provide `operator[]` in const and non-const pairs",
    "Apply the principle of least surprise, and know when not to overload",
  ],
  sections: [
    {
      id: "principle",
      heading: "The rule that matters",
      body: [
        "Operator overloading lets your type use the same syntax as a built-in one. `std::string` supports `+`, `std::vector` supports `[]`, `std::cout` supports `<<` — all of it is operator overloading, none of it is special compiler magic.",
        "There is one rule, and it decides almost every question: **make the operator mean what a reader would assume it means.**",
        "`+` should combine and produce a new value without modifying its operands. `==` should be an equality that is reflexive, symmetric and transitive. `<` should be a consistent ordering. `[]` should be element access. **If your `+` sends a network request or your `==` compares only some fields, the syntax is lying**, and a reader who trusts it will be wrong.",
        "The corollary: **when in doubt, use a named function.** `matrix.multiply_elementwise(other)` is unambiguous, while `matrix * other` leaves a reader guessing between element-wise and matrix multiplication. Clever operator overloading is one of the classic ways C++ codebases become hard to read.",
        "Some things you cannot do: you cannot invent new operators, cannot change precedence or arity, and cannot overload `::`, `.`, `.*`, `?:` or `sizeof`. At least one operand must be a user-defined type, so you cannot redefine `int + int`.",
      ],
    },
    {
      id: "member-or-free",
      heading: "Member or free function?",
      body: [
        "A member operator's left operand is always `*this`. That single fact decides most cases.",
        "**Must be members:** `=`, `[]`, `()`, `->`, and conversion operators. The language requires it.",
        "**Should be members:** anything that modifies the left operand and is conceptually part of the type — the compound assignments `+=`, `-=`, `*=`, and the increment and decrement operators.",
        "**Should be free functions:** the symmetric binary operators — `+`, `-`, `*`, `/`, `==`, `<=>`. The reason is conversions. If `+` is a member, the left operand must already be your type, so `2.0 * money` will not compile while `money * 2.0` will. As a free function, both operands are eligible for implicit conversion and the operator behaves symmetrically, as arithmetic should.",
        "**Must be free functions:** anything whose left operand is not your type. `operator<<` is the everyday case, since the left operand is `std::ostream`.",
        "A free operator that needs private data can be declared `friend` inside the class, as in lesson 6. Better still, implement it in terms of the public interface and avoid the friendship.",
      ],
      examples: [
        {
          id: "money-operators",
          title: "The canonical shape, end to end",
          lang: "cpp",
          code: `#include <compare>
#include <cstdlib>
#include <iostream>

class Money {
public:
    constexpr explicit Money(long long cents) : cents_(cents) {}

    // Compound assignment as a member; it modifies *this.
    Money& operator+=(Money rhs) { cents_ += rhs.cents_; return *this; }
    Money& operator-=(Money rhs) { cents_ -= rhs.cents_; return *this; }

    // Comparison: one line generates all six.
    auto operator<=>(const Money&) const = default;
    bool operator==(const Money&) const = default;

    long long cents() const { return cents_; }

private:
    long long cents_;
};

// Binary + as a free function, implemented in terms of +=.
Money operator+(Money lhs, Money rhs) { lhs += rhs; return lhs; }
Money operator-(Money lhs, Money rhs) { lhs -= rhs; return lhs; }

// Stream output must be a free function: the stream is the left operand.
std::ostream& operator<<(std::ostream& os, Money m) {
    return os << (m.cents() < 0 ? "-" : "") << std::abs(m.cents()) / 100
              << '.' << (std::abs(m.cents()) % 100 < 10 ? "0" : "")
              << std::abs(m.cents()) % 100;
}

int main() {
    Money a{1250}, b{399};
    std::cout << a << " + " << b << " = " << a + b << '\\n';
    std::cout << a << " - " << b << " = " << a - b << '\\n';
    std::cout << std::boolalpha
              << (a > b) << ' ' << (a == Money{1250}) << ' ' << (b < a) << '\\n';

    Money total{0};
    total += a; total += b;
    std::cout << "total " << total << '\\n';
}`,
          output: `12.50 + 3.99 = 16.49
12.50 - 3.99 = 8.51
true true true
total 16.49`,
          explanation:
            "**Three details worth copying.** `operator+` takes its left operand **by value**, mutates that copy with `+=`, and returns it — so the arithmetic logic exists once, in `+=`, and `+` is two lines that cannot drift out of sync. The defaulted `<=>` generated `<`, `>`, `<=` and `>=` from one line, as in module 1. And `Money` stores **integer cents**, never a `double` — money in floating point is the classic bug from module 1's types lesson.",
        },
      ],
    },
    {
      id: "common-operators",
      heading: "The ones you will actually write",
      body: [
        "**`operator<<` for output.** A free function taking `std::ostream&` and returning it, so calls chain. Take your type by `const&` unless it is tiny.",
        "**`operator==` and `operator<=>`.** Since C++20, `= default` on both generates member-wise comparison and all six operators. Write them by hand only when equality is not member-wise — ignoring a cache field, or comparing case-insensitively.",
        "**`operator[]` in a const and non-const pair**, exactly as in module 3's const-correctness lesson: the non-const one returns `T&` and the const one returns `const T&`.",
        "**`operator()`** makes your type callable — a *function object*. This is how comparators and predicates are passed to algorithms, and lambdas are compiler-generated classes with an `operator()`.",
        "**`operator*` and `operator->`** make your type behave like a pointer, which is how smart pointers and iterators work. `->` is unusual: it is applied repeatedly until it yields a raw pointer.",
        "**`operator bool`**, and it should be `explicit`. That is what lets `if (ptr)` work while blocking nonsense like `ptr + 1` or `ptr == some_int`. Marking a conversion operator `explicit` still permits it in a boolean context, which is exactly the behaviour you want.",
      ],
      examples: [
        {
          id: "container-operators",
          title: "Subscript, call, and explicit bool",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <vector>

class Grid {
public:
    Grid(std::size_t rows, std::size_t cols)
        : rows_(rows), cols_(cols), cells_(rows * cols, 0) {}

    // operator() can take several arguments; operator[] could not before C++23.
    int&       operator()(std::size_t r, std::size_t c)       { return at(r, c); }
    const int& operator()(std::size_t r, std::size_t c) const { return at(r, c); }

    // Valid if it has any cells at all. explicit keeps it out of arithmetic.
    explicit operator bool() const { return !cells_.empty(); }

    std::size_t rows() const { return rows_; }

private:
    int& at(std::size_t r, std::size_t c) {
        if (r >= rows_ || c >= cols_) throw std::out_of_range("grid index");
        return cells_[r * cols_ + c];
    }
    const int& at(std::size_t r, std::size_t c) const {
        if (r >= rows_ || c >= cols_) throw std::out_of_range("grid index");
        return cells_[r * cols_ + c];
    }

    std::size_t      rows_, cols_;
    std::vector<int> cells_;
};

int main() {
    Grid g{2, 3};
    g(0, 0) = 1;
    g(1, 2) = 9;

    const Grid& readonly = g;
    std::cout << readonly(0, 0) << ' ' << readonly(1, 2) << '\\n';

    if (g) std::cout << "grid is usable, " << g.rows() << " rows\\n";
    // int n = g;             // ERROR: explicit blocks this
    // int n = g + 1;         // ERROR: and this

    try { g(5, 5) = 0; }
    catch (const std::out_of_range& e) { std::cout << "caught: " << e.what() << '\\n'; }
}`,
          output: `1 9
grid is usable, 2 rows
caught: grid index`,
          explanation:
            "**`operator()` is the idiomatic choice for multi-dimensional indexing** — before C++23, `operator[]` accepted exactly one argument, which is why every matrix library in C++ uses `m(r, c)` rather than `m[r][c]`. C++23 allows multiple subscript arguments, so new code can use `m[r, c]`. The `explicit operator bool` is doing real work: `if (g)` compiles, `int n = g;` does not.",
        },
      ],
    },
    {
      id: "when-not",
      heading: "When not to overload",
      body: [
        "Four cases where the answer is a named function.",
        "**When the meaning is not obvious.** For a matrix type, `*` could be matrix multiplication or element-wise. Pick one and name the other.",
        "**When the operation is expensive.** Operators read as cheap. An `operator==` that opens a database connection will be called in a loop by someone who assumed otherwise.",
        "**When it can throw unexpectedly.** A `+` that may fail is surprising; a function named `try_add` returning `std::expected` is not.",
        "**When you are being clever.** Overloading `,` or `&&` is legal and always a mistake — both lose their short-circuit and sequencing guarantees when overloaded, which module 1's operators lesson showed matters.",
        "Two more specific cautions. **Prefix `++` should return a reference and postfix should return a value** — postfix takes a dummy `int` parameter to distinguish it, and must copy, which is why module 1 recommended preferring `++i`. And **`operator=` should handle self-assignment**, return `*this` by reference, and is covered properly in module 5 alongside copy and move.",
      ],
      examples: [
        {
          id: "increment-forms",
          title: "Prefix and postfix, and why prefix is cheaper",
          lang: "cpp",
          code: `#include <iostream>

class Counter {
public:
    // Prefix: modify, return a reference to self. No copy.
    Counter& operator++() { ++value_; return *this; }

    // Postfix: the dummy int distinguishes it. Must copy to return the old value.
    Counter operator++(int) {
        Counter old = *this;
        ++value_;
        std::cout << "  [postfix copied] ";
        return old;
    }

    int value() const { return value_; }

private:
    int value_ = 0;
};

int main() {
    Counter c;
    std::cout << "prefix:  " << (++c).value() << '\\n';
    std::cout << "postfix: " << (c++).value() << '\\n';
    std::cout << "now:     " << c.value() << '\\n';
}`,
          output: `prefix:  1
postfix:   [postfix copied] 1
now:     2`,
          explanation:
            "**The postfix version constructed a whole extra object** to return the previous state, and `(c++).value()` reported 1 — the value *before* the increment — while `c` is now 2. For an `int` the compiler removes the copy; for an iterator or any real class it does not. That is the concrete reason behind the module 1 advice to write `++i` in loops even when you discard the result. Note where `[postfix copied]` lands: the literal `\"postfix: \"` is inserted first and the increment runs second, because chained `<<` is sequenced left to right since C++17.",
        },
      ],
      pitfalls: [
        {
          title: "Overloading `&&`, `||` or `,` loses their guarantees",
          body: "The built-in `&&` and `||` short-circuit, and the built-in comma sequences its operands left to right. **An overloaded version is an ordinary function call, so all operands are evaluated, in unspecified order.** Code that relied on `p && p->ready()` being safe becomes a null dereference. There is no good reason to overload any of the three, and expression-template libraries that historically did have moved to other techniques.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Which operators should be members and which should be free functions?",
      answer:
        "`=`, `[]`, `()`, `->` and conversion operators must be members. Compound assignments like `+=` should be members, since they modify the left operand. Symmetric binary operators — `+`, `-`, `==`, `<=>` — should be free functions, because a member's left operand must already be your type, so `2.0 * money` would fail to compile while `money * 2.0` succeeded. As free functions both operands are eligible for implicit conversion and the operator behaves symmetrically. Anything whose left operand is not your type, such as `operator<<`, must be free.",
    },
    {
      question: "Why implement `operator+` in terms of `operator+=`?",
      answer:
        "So the arithmetic exists in exactly one place and the two cannot drift apart. The canonical form takes the left operand **by value**, applies `+=` to that copy, and returns it — two lines. The by-value parameter is deliberate: it is the copy you were going to make anyway, and it lets the compiler elide it or move into it when the argument is a temporary.",
    },
    {
      question: "Why should `operator bool` be `explicit`?",
      answer:
        "Because a non-explicit conversion to `bool` allows the type to convert to `int` implicitly, which permits nonsense like `ptr + 1`, `ptr == 42` or `ptr << 2` compiling silently. Marking it `explicit` blocks all of that while still allowing use in a boolean context — `if (ptr)`, `while (stream)`, `!ptr` — because those are *contextual* conversions the language permits for explicit operators. `std::unique_ptr` and the stream types both do exactly this.",
    },
    {
      question: "What is the difference between prefix and postfix `++`?",
      answer:
        "Prefix modifies and returns a reference to the object, costing nothing extra. Postfix must return the value *before* the increment, so it copies the object, increments, and returns the copy. It is distinguished in the declaration by a dummy `int` parameter. For built-in types the compiler elides the copy, but for an iterator or any class with real state it does not — which is why the advice is to write `++i` in loops even when the result is discarded.",
    },
    {
      question: "When should you not overload an operator?",
      answer:
        "When the meaning is not obvious — `*` on a matrix could be matrix or element-wise multiplication, so name at least one. When the operation is expensive, because operator syntax reads as cheap and will be called in loops. When it can fail in surprising ways, where a named function returning `std::expected` is clearer. And never for `&&`, `||` or `,` — overloading them turns them into ordinary function calls, losing short-circuiting and sequencing, so `p && p->ready()` becomes a null dereference.",
    },
  ],
  takeaways: [
    "One rule: the operator must mean what a reader assumes; otherwise use a named function",
    "`=`, `[]`, `()`, `->` and conversions must be members; symmetric binary operators should be free",
    "A member operator's left operand is always `*this`, which is why `2.0 * money` needs a free function",
    "Implement `+` as a free function taking the left operand by value and applying `+=` to it",
    "`operator<<` must be free, takes `std::ostream&`, and returns it so calls chain",
    "`= default` on `operator<=>` and `operator==` generates all six comparisons",
    "Make `operator bool` explicit — `if (x)` still works, `x + 1` stops compiling",
    "Never overload `&&`, `||` or `,` — they lose short-circuiting and sequencing",
  ],
  status: "available",
};
