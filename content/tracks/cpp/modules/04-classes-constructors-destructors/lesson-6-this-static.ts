import type { Lesson } from "@/content/types";

export const thisStaticLesson: Lesson = {
  id: "cpp-this-static",
  slug: "this-static-members-friends",
  moduleSlug: "classes-constructors-destructors",
  title: "this, Static Members & friend",
  summary:
    "The hidden parameter every member function receives, how returning `*this` enables method chaining, static members that belong to the class rather than to any object, and the one keyword that deliberately breaks encapsulation.",
  estimatedMinutes: 30,
  objectives: [
    "Explain what `this` is and when you must write it",
    "Return `*this` to support method chaining",
    "Declare and define static data members and static member functions",
    "Use `static inline` to avoid a separate definition",
    "Use `friend` sparingly and know why it does not break encapsulation",
  ],
  sections: [
    {
      id: "this",
      heading: "this: the hidden parameter",
      body: [
        "Every non-static member function receives a hidden pointer to the object it was called on, named `this`. `obj.method(arg)` is, conceptually, `method(&obj, arg)`.",
        "Its type reflects the function's constness: `T* const this` in an ordinary member function, `const T* const this` in a `const` one. That is the entire mechanism behind `const` member functions from module 3.",
        "**You rarely need to write `this` explicitly**, because unqualified member names resolve to it automatically — `value_` means `this->value_`. Three cases where you do:",
        "**To disambiguate** when a parameter shadows a member: `this->value = value;`. Many codebases avoid this by naming members with a trailing underscore, which is the cleaner fix.",
        "**To return the object itself**, as `*this` for a reference or `this` for a pointer.",
        "**To pass the object to something else** — registering a callback, inserting into a container of pointers.",
        "In a template base class you also sometimes need `this->` to make a dependent name visible, which module 7 covers.",
      ],
      examples: [
        {
          id: "chaining",
          title: "Returning *this for chaining, and static members",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

class Account {
public:
    explicit Account(std::string owner)
        : owner_(std::move(owner)), id_(++next_id_) { ++open_accounts_; }
    ~Account() { --open_accounts_; }

    // Returns *this by reference to allow chaining.
    Account& deposit(double amount)  { balance_ += amount; return *this; }
    Account& withdraw(double amount) { balance_ -= amount; return *this; }

    int id() const { return id_; }
    double balance() const { return balance_; }
    const std::string& owner() const { return owner_; }

    static int open_accounts() { return open_accounts_; }   // no object needed

private:
    std::string owner_;
    int         id_;
    double      balance_ = 0.0;

    static inline int next_id_       = 0;   // C++17 inline static: no .cpp needed
    static inline int open_accounts_ = 0;
};

int main() {
    std::cout << "open: " << Account::open_accounts() << '\\n';
    Account a{"Ada"};
    {
        Account b{"Grace"};
        std::cout << "open: " << Account::open_accounts() << '\\n';
        std::cout << "ids: " << a.id() << ' ' << b.id() << '\\n';
    }
    std::cout << "open: " << Account::open_accounts() << '\\n';

    a.deposit(100).deposit(50).withdraw(30);       // chaining via *this
    std::cout << a.owner() << ": " << a.balance() << '\\n';
}`,
          output: `open: 0
open: 2
ids: 1 2
open: 1
Ada: 120`,
          explanation:
            "**The chain works because each call returns a reference to the same object**, so the next call applies to it. Return a *reference*, not a value — returning by value would copy and every call in the chain would modify a different temporary. Note `open_accounts()` was callable before any `Account` existed: a static member function belongs to the class, has no `this`, and so cannot touch non-static members.",
        },
      ],
      pitfalls: [
        {
          title: "Do not `delete this` unless you know exactly why",
          body: "It is legal, and reference-counted types occasionally use it, but afterwards the object no longer exists and any subsequent member access — including reading a member in the same function — is undefined behaviour. It also requires that the object was created with `new` and that nobody else holds a pointer. In modern C++ `std::shared_ptr` does this job correctly, and a hand-written `delete this` is nearly always a design that should be replaced.",
        },
      ],
    },
    {
      id: "static-members",
      heading: "Static data members and static member functions",
      body: [
        "A **static data member** belongs to the class, not to any object. There is exactly one instance of it regardless of how many objects exist, and it lives for the whole program.",
        "Use it for something genuinely shared: a counter of live instances, a next-id generator, a shared configuration, a constant table.",
        "**A static member function** likewise belongs to the class. It has no `this`, so it cannot access non-static members — but it *can* access private static members, which makes it the natural place for factory functions and class-level utilities. Call it as `Account::open_accounts()`, or through an object, which is legal but misleading.",
        "**Declaration and definition used to be separate**, and this is the part that trips people up. Before C++17, a static data member was *declared* in the class and had to be *defined* once in a `.cpp` file — omitting the definition produced a linker error, not a compiler one.",
        "**C++17's `inline` variables removed that requirement.** `static inline int next_id_ = 0;` inside the class is a complete definition, no `.cpp` needed. `static constexpr` members are implicitly `inline` too. Use these; the out-of-line definition is now legacy.",
      ],
      examples: [
        {
          id: "static-definition",
          title: "The linker error, and the C++17 fix",
          lang: "cpp",
          code: `// --- Pre-C++17: two places ---
// widget.h
class Widget {
    static int count_;              // declaration only
public:
    static int count() { return count_; }
};

// widget.cpp
int Widget::count_ = 0;             // definition — forget this and the LINKER complains:
                                    // undefined reference to 'Widget::count_'

// --- C++17 and later: one place ---
class Better {
    static inline int count_ = 0;          // complete definition
    static constexpr double kPi = 3.14159; // implicitly inline
public:
    static int count() { return count_; }
    static constexpr double pi() { return kPi; }
};`,
          explanation:
            "**The pre-C++17 failure is a linker error, not a compiler one**, because the class declaration is a promise the linker expects someone to keep — the same mechanism as the `undefined reference` from module 1. The `inline` form removes the possibility entirely, which matters most for header-only libraries where there is no `.cpp` to put the definition in.",
        },
      ],
      pitfalls: [
        {
          title: "Static members are global state wearing a class's name",
          body: "A static counter shared across every instance has all the usual problems of a global: it makes tests order-dependent, it is not thread-safe without your own synchronisation, and it means two logically separate parts of a program silently share data. The `next_id_` and `open_accounts_` above are defensible because they are genuinely class-wide facts. Reach for a static member when the data belongs to the *type*; if it belongs to a particular context, pass that context in instead.",
        },
      ],
    },
    {
      id: "friend",
      heading: "friend",
      body: [
        "A `friend` declaration grants another function or class access to your private members. It is the one deliberate hole in encapsulation, and it exists because some operations genuinely belong to a type without being members of it.",
        "**The main legitimate use is a binary operator whose left operand is not your class.** `operator<<` for streams is the canonical example: the left operand is `std::ostream`, which you cannot modify, so the operator must be a free function — and if it needs private data, it must be a friend. Lesson 7 covers this.",
        "The second use is a genuinely paired type, where two classes are two halves of one abstraction — a container and its iterator, for instance.",
        "**A friend declaration does not break encapsulation, it documents it.** Friendship must be granted *by* the class, in the class definition, so the set of code that can touch your privates is still enumerable by reading the class — which was the whole point of `private` in lesson 2. Compare with making a member public, where the set becomes unbounded.",
        "It is still worth being sparing. Friendship is not inherited, is not transitive, and is not reciprocal — three properties that surprise people. And a class with a long list of friends usually has an interface problem.",
      ],
      examples: [
        {
          id: "friend-demo",
          title: "The one you will actually write",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

class Temperature {
public:
    explicit Temperature(double celsius) : celsius_(celsius) {}

    // The left operand is the stream, so this cannot be a member function.
    friend std::ostream& operator<<(std::ostream& os, const Temperature& t);

    // A free function that needs the private representation.
    friend Temperature midpoint(const Temperature& a, const Temperature& b);

private:
    double celsius_;
};

std::ostream& operator<<(std::ostream& os, const Temperature& t) {
    return os << t.celsius_ << "C";     // reaches celsius_ because it is a friend
}

Temperature midpoint(const Temperature& a, const Temperature& b) {
    return Temperature{(a.celsius_ + b.celsius_) / 2.0};
}

int main() {
    Temperature cold{-5.0}, warm{25.0};
    std::cout << cold << " and " << warm
              << " meet at " << midpoint(cold, warm) << '\\n';
}`,
          output: `-5C and 25C meet at 10C`,
          explanation:
            "**`operator<<` has to be a free function**, because a member function's implicit `this` is always the *left* operand — writing it as a member would mean `temperature << std::cout`, which is backwards. The `friend` grant is what lets it read `celsius_`. Note that `midpoint` could equally have used the public interface if there were a `celsius()` accessor; **friendship is only justified when the public interface genuinely cannot express the operation**, which is rarer than it first appears.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is `this` and what type does it have?",
      answer:
        "A hidden pointer to the object a non-static member function was called on — `obj.method(x)` is conceptually `method(&obj, x)`. Its type is `T* const` in an ordinary member function and `const T* const` in a `const` one, which is exactly how `const` member functions are enforced. You rarely write it, since unqualified member names resolve through it, but you need it to disambiguate a shadowing parameter, to return the object as `*this`, and to hand the object to something else such as a callback.",
    },
    {
      question: "How does method chaining work?",
      answer:
        "Each function returns `*this` as a reference, so the next call in the chain applies to the same object — `a.deposit(100).deposit(50).withdraw(30)`. The key detail is returning a *reference* rather than a value: returning by value would copy, and each call in the chain would modify a different temporary while the original stayed unchanged. It is how stream insertion and most builder-style interfaces work.",
    },
    {
      question: "What is the difference between a static and a non-static member?",
      answer:
        "A static data member belongs to the class rather than to any object: there is one instance regardless of how many objects exist, and it lives for the whole program. A static member function has no `this`, so it cannot touch non-static members, but it can access private static ones — which makes it right for factory functions and class-level utilities. Both are accessed as `Class::member`. Static members are effectively globals scoped to a class, so they carry the usual costs around testability and thread safety.",
    },
    {
      question: "Why did static data members historically need a definition in a `.cpp` file?",
      answer:
        "Because the in-class declaration is only a declaration — it tells the compiler the member exists but does not allocate storage. Without a definition in exactly one translation unit, the linker reports `undefined reference`, the same mechanism as any other missing definition. C++17 fixed this with `inline` variables: `static inline int count_ = 0;` in the class is a complete definition, and `static constexpr` members are implicitly inline. This matters most for header-only libraries, where there is no `.cpp` to put the definition in.",
    },
    {
      question: "Does `friend` break encapsulation?",
      answer:
        "No — it documents it. Friendship must be granted by the class itself, inside the class definition, so the set of code able to touch private members remains enumerable by reading the class, which was the point of `private` in the first place. Making a member public, by contrast, makes that set unbounded. The main legitimate use is a binary operator whose left operand is not your type, such as `operator<<` for streams, which cannot be a member. Friendship is not inherited, not transitive and not reciprocal, and a long friend list usually signals an interface problem.",
    },
  ],
  takeaways: [
    "Every non-static member function receives a hidden `this`; its constness is what enforces `const` member functions",
    "Write `this->` only to disambiguate a shadowed name, to return the object, or to hand it to something else",
    "Return `*this` **by reference** to chain — returning by value would modify temporaries instead",
    "A static data member belongs to the class, exists once, and lives for the whole program",
    "A static member function has no `this`, so it cannot access non-static members",
    "`static inline` (C++17) makes the in-class declaration a complete definition — no `.cpp` needed",
    "Missing a pre-C++17 out-of-line definition is a *linker* error, not a compiler one",
    "`friend` is granted by the class, so the set of code touching your privates stays enumerable",
  ],
  status: "available",
};
