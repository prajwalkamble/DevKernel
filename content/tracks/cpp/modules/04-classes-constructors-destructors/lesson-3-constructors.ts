import type { Lesson } from "@/content/types";

export const constructorsLesson: Lesson = {
  id: "cpp-constructors",
  slug: "constructors",
  moduleSlug: "classes-constructors-destructors",
  title: "Constructors",
  summary:
    "The function that turns raw memory into a valid object. Overloading and delegating constructors, why `explicit` should be your default for single-argument constructors, and the compiler-generated ones you get whether you want them or not.",
  estimatedMinutes: 35,
  objectives: [
    "Write constructors, including overloaded and delegating ones",
    "Explain when the compiler generates a default constructor and when it does not",
    "Use `explicit` to block implicit conversions, and say why it matters",
    "Use `= default` and `= delete` deliberately",
    "Understand what happens when a constructor throws",
  ],
  sections: [
    {
      id: "basics",
      heading: "What a constructor is",
      body: [
        "A constructor is a special member function with **the same name as the class and no return type**. It runs after memory is allocated, and its job is to turn that raw memory into an object satisfying the class invariant.",
        "It is the only place the invariant can be established, because it is the only code guaranteed to run before anyone can use the object.",
        "You can have as many as you like, distinguished by their parameters like any other overload set. A class with several constructors is offering several ways to build a valid object.",
        "**A delegating constructor** calls another constructor of the same class in its initialiser list. This is how you avoid duplicating validation across overloads: one constructor does the real work and the others funnel into it.",
      ],
      examples: [
        {
          id: "constructor-forms",
          title: "Overloading, delegating, and explicit",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

class Rectangle {
public:
    Rectangle() : Rectangle(1.0, 1.0) {}                     // delegating
    Rectangle(double side) : Rectangle(side, side) {}         // delegating
    Rectangle(double w, double h) : width_(w), height_(h) {   // the real one
        std::cout << "  built " << width_ << "x" << height_ << '\\n';
    }
    double area() const { return width_ * height_; }
private:
    double width_, height_;
};

class Meters {
public:
    explicit Meters(double v) : value_(v) {}   // explicit: no implicit conversion
    double value() const { return value_; }
private:
    double value_;
};

void travel(Meters distance) { std::cout << "  travelling " << distance.value() << "m\\n"; }

int main() {
    Rectangle unit;          // default
    Rectangle square{3.0};   // one argument
    Rectangle rect{2.0, 5.0};
    std::cout << unit.area() << ' ' << square.area() << ' ' << rect.area() << '\\n';

    travel(Meters{100.0});
    // travel(100.0);        // ERROR: explicit blocks the implicit conversion
}`,
          output: `  built 1x1
  built 3x3
  built 2x5
1 9 10
  travelling 100m`,
          explanation:
            "**Only the two-argument constructor ever printed**, three times — the other two delegated to it. That is the value of delegation: validation, logging and setup live in exactly one place, and adding a fourth way to construct a `Rectangle` cannot forget any of it. Note `Rectangle unit;` with no braces: this is the one case where empty parentheses would trigger the most vexing parse, so either `Rectangle unit;` or `Rectangle unit{};` is required.",
        },
      ],
      pitfalls: [
        {
          title: "A delegating constructor cannot also initialise members",
          body: "`Rectangle(double s) : Rectangle(s, s), extra_(1) {}` does not compile. Delegation must be the *only* entry in the initialiser list, because the delegated-to constructor is responsible for initialising everything. If you need extra work, do it in the delegating constructor's **body**, which runs after the delegated constructor completes.",
        },
      ],
    },
    {
      id: "explicit",
      heading: "explicit, and why it should be your default",
      body: [
        "A constructor callable with a single argument doubles as an **implicit conversion** from that argument's type to your class. The compiler will apply it silently, anywhere a conversion is allowed.",
        "That is occasionally what you want — `std::string` from `const char*` is a deliberate example — and usually not. It means a function taking your carefully designed type will quietly accept a bare number.",
        "**`explicit` disables the implicit conversion.** The constructor can still be called; it just has to be called by name.",
        "**Make single-argument constructors `explicit` by default**, and remove it only when the implicit conversion is genuinely desirable and safe. Since C++11, `explicit` also applies to multi-argument constructors, where it blocks copy-list-initialisation like `Rectangle r = {2.0, 5.0};`.",
      ],
      examples: [
        {
          id: "explicit-trap",
          title: "What a non-explicit constructor lets through",
          lang: "cpp",
          code: `#include <iostream>

class Meters {
public:
    Meters(double v) : value_(v) {}     // NOT explicit
    double value() const { return value_; }
private:
    double value_;
};

void travel(Meters d) { std::cout << "travelling " << d.value() << "m\\n"; }

int main() {
    travel(100.0);       // silently converts
    travel(true);        // bool -> double -> Meters. Nonsense, but it compiles.
}`,
          output: `travelling 100m
travelling 1m`,
          explanation:
            "**`travel(true)` compiled and travelled one metre.** The chain is `bool` to `double` (a standard conversion) then `double` to `Meters` (your constructor), and only one user-defined conversion is permitted so it is legal. No warning. With `explicit` on the constructor, both calls fail to compile and the caller must write `travel(Meters{100.0})` — which is also more readable, since the unit is now visible at the call site.",
        },
      ],
    },
    {
      id: "generated",
      heading: "The constructors you get for free",
      body: [
        "The compiler generates member functions you did not write, and the rules for *when* are worth knowing because they cause real surprises.",
        "**The default constructor** is generated only if you declare **no constructors at all**. Write any constructor — even a two-argument one — and the default disappears. This is why adding a constructor to a struct can break `std::vector<T> v(10);` elsewhere, which needs to default-construct.",
        "**The copy constructor and copy assignment** are generated if you do not declare them, and they copy each member. Module 5 covers when that is wrong.",
        "**The move constructor and move assignment** are generated only if you have declared no copy operations, no move operations and no destructor. Declaring a destructor silently disables move generation — a genuine performance trap covered in module 5.",
        "**The destructor** is always generated if you do not write one.",
        "Two keywords let you control this explicitly. **`= default`** asks for the compiler's version, which is useful when declaring another constructor removed it. **`= delete`** removes a function entirely, so calling it is a compile error rather than a link error or a silent surprise.",
      ],
      examples: [
        {
          id: "default-delete",
          title: "= default and = delete",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

class Config {
public:
    Config() = default;                        // brought back explicitly
    explicit Config(std::string path) : path_(std::move(path)) {}

    // A handle to a unique resource should not be copied.
    Config(const Config&)            = delete;
    Config& operator=(const Config&) = delete;

    // ...but moving it is fine.
    Config(Config&&)            = default;
    Config& operator=(Config&&) = default;

    const std::string& path() const { return path_; }
private:
    std::string path_;
};

class NoDefault {
public:
    explicit NoDefault(int v) : value_(v) {}   // suppresses the default ctor
    int value() const { return value_; }
private:
    int value_;
};

int main() {
    Config a;                                  // works: = default
    Config b{"/etc/app.conf"};
    // Config c = b;                           // ERROR: deleted
    Config d = std::move(b);                   // OK: moved
    std::cout << "d.path = " << d.path() << ", b.path = '" << b.path() << "'\\n";

    // std::vector<NoDefault> v(3);            // ERROR: no default constructor
    std::vector<NoDefault> v;
    v.emplace_back(7);                         // constructs in place
    std::cout << "v[0] = " << v[0].value() << '\\n';
}`,
          output: `d.path = /etc/app.conf, b.path = ''
v[0] = 7`,
          explanation:
            "**`b.path()` is empty after the move** — `std::string`'s move constructor left it in a valid but unspecified state, which in practice is empty. That is the contract for moved-from objects: usable, but you must not assume a value. And `std::vector<NoDefault> v(3);` fails because that constructor default-constructs three elements; `emplace_back(7)` works because it forwards arguments to a constructor that exists.",
        },
      ],
      pitfalls: [
        {
          title: "`= delete` beats making a constructor private",
          body: "The pre-C++11 way to forbid copying was to declare the copy constructor private and never define it. That worked, but the error came from the *linker* if the class's own members tried it, and the message named a mangled symbol. `= delete` makes it a clean compile error at the call site — `use of deleted function` — and works uniformly for any function, including specific overloads you want to block. You will still see the private-undefined idiom in older code.",
        },
      ],
    },
    {
      id: "throwing",
      heading: "When a constructor fails",
      body: [
        "A constructor has no return value, so **the only way it can report failure is by throwing.** That is not a workaround; it is the design.",
        "The consequence is precise and important: **if a constructor throws, the object never existed, and its destructor will not run.** There is no half-constructed object, and nothing will clean one up.",
        "But members already constructed *are* destroyed. If your class has three members and the third one's constructor throws, the first two are destroyed correctly and the exception propagates.",
        "That is exactly why RAII members matter. **A class whose members are all RAII types is exception-safe in its constructor for free** — any failure destroys what was built so far. A class that calls `new` in its constructor body and then throws leaks, because the destructor that would have freed it never runs.",
        "The alternative to throwing is a two-phase `init()` method returning an error code. Avoid it: it reintroduces the invalid-object state that constructors exist to eliminate, and every member function must then cope with being called on an uninitialised object. If construction can fail in a way that is not exceptional, use a static factory function returning `std::optional<T>` or `std::expected<T, E>`.",
      ],
      examples: [
        {
          id: "throwing-constructor",
          title: "What is destroyed when construction fails",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <string>

struct Part {
    std::string name;
    explicit Part(std::string n) : name(std::move(n)) {
        std::cout << "  + " << name << '\\n';
        if (name == "third") throw std::runtime_error("third part failed");
    }
    ~Part() { std::cout << "  - " << name << '\\n'; }
};

class Assembly {
public:
    Assembly() : a_("first"), b_("second"), c_("third") {
        std::cout << "  Assembly body (never reached)\\n";
    }
    ~Assembly() { std::cout << "  ~Assembly (never runs)\\n"; }
private:
    Part a_, b_, c_;
};

int main() {
    try { Assembly assembly; }
    catch (const std::exception& e) { std::cout << "caught: " << e.what() << '\\n'; }
    std::cout << "still running\\n";
}`,
          output: `  + first
  + second
  + third
  - second
  - first
caught: third part failed
still running`,
          explanation:
            "**`~Assembly` never printed, but `second` and `first` were destroyed** — in reverse order, as always. The `Assembly` object never came into existence so it has nothing to destroy, while its two completed members are cleaned up individually. This is the guarantee that makes RAII members exception-safe: **each member's own destructor handles its own resource, so partial construction cannot leak.**",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "When does the compiler generate a default constructor?",
      answer:
        "Only when you declare no constructors at all. Declaring any constructor — including a two-argument one — suppresses it, which is why adding a constructor to a struct can break `std::vector<T> v(10);` somewhere else, since that needs to default-construct elements. You can bring it back with `Config() = default;`. The related rules are that copy operations are generated unless you declare them, and move operations only if you have declared no copy operations, no move operations *and* no destructor.",
    },
    {
      question: "What does `explicit` do and when should you use it?",
      answer:
        "It stops a constructor being used as an implicit conversion. Without it, a single-argument constructor means the compiler will silently convert that argument type to your class anywhere a conversion is allowed — so `travel(true)` can compile and travel one metre, via `bool` to `double` to your type. Make single-argument constructors `explicit` by default and remove it only where the conversion is genuinely wanted, as with `std::string` from `const char*`. Since C++11 it also applies to multi-argument constructors, where it blocks copy-list-initialisation.",
    },
    {
      question: "What happens if a constructor throws?",
      answer:
        "The object never existed, so its destructor will not run — there is no half-constructed object for anything to clean up. However, members and base classes that were fully constructed before the throw *are* destroyed, in reverse order. That is what makes RAII members exception-safe for free: each one releases its own resource, so partial construction cannot leak. By contrast, a constructor that calls `new` into a raw pointer and then throws leaks, because the destructor that would have freed it never runs.",
    },
    {
      question: "What is a delegating constructor?",
      answer:
        "A constructor that calls another constructor of the same class in its initialiser list, so validation and setup live in one place rather than being duplicated across overloads. The delegation must be the only entry in the initialiser list — you cannot delegate *and* initialise members, because the target constructor is responsible for all of them. Extra work goes in the delegating constructor's body, which runs after the delegated-to one completes.",
    },
    {
      question: "Why prefer `= delete` to making a function private and undefined?",
      answer:
        "`= delete` produces a clean compile error at the call site — `use of deleted function` — whereas the private-and-undefined idiom produces a *linker* error naming a mangled symbol, and only when the class's own members or friends attempt it. `= delete` also works for any function, including specific overloads you want to block, such as deleting a `const char*` overload to prevent a string literal binding to a `bool` parameter. The old idiom is still common in pre-C++11 code.",
    },
  ],
  takeaways: [
    "A constructor has the class's name and no return type; it is the only place an invariant can be established",
    "Delegating constructors funnel to one real constructor, so validation is never duplicated",
    "Delegation must be the sole initialiser-list entry — extra work goes in the body",
    "Make single-argument constructors `explicit` by default; without it `travel(true)` can silently compile",
    "Declaring any constructor removes the compiler-generated default — bring it back with `= default`",
    "`= delete` gives a compile error at the call site, unlike the old private-and-undefined idiom",
    "A throwing constructor means the object never existed, so its destructor never runs",
    "Fully constructed members *are* destroyed on a constructor throw, which is why RAII members are exception-safe for free",
  ],
  status: "available",
};
