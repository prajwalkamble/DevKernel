import type { Lesson } from "@/content/types";

export const abstractClassesLesson: Lesson = {
  id: "cpp-abstract-classes",
  slug: "abstract-classes-and-interfaces",
  moduleSlug: "inheritance-polymorphism",
  title: "Abstract Classes, Pure Virtual Functions & Interfaces",
  summary:
    "Declaring what a type must do without saying how. `= 0` and the class it makes impossible to instantiate, the interface as C++ spells it, the non-virtual interface idiom, and why depending on an abstract base is what makes code testable.",
  estimatedMinutes: 35,
  objectives: [
    "Declare a pure virtual function and explain what it does to the class",
    "Read the compiler error you get for instantiating an abstract type",
    "Write an interface class correctly, destructor included",
    "Apply the non-virtual interface idiom to keep invariants out of subclasses' reach",
    "Use an abstract base to substitute a fake implementation in a test",
  ],
  sections: [
    {
      id: "pure-virtual",
      heading: "`= 0` and what it forbids",
      body: [
        "A **pure virtual function** is declared with `= 0` and says: every concrete class in this hierarchy must provide this, and the base has no sensible version of it.",
        "A class with at least one pure virtual function is **abstract**, which has one consequence enforced by the compiler: **you cannot create an object of it.** Not as a variable, not with `new`, not as a `std::vector` element. You may still use `Shape*` and `Shape&` freely — and that is the point, because those are exactly what polymorphism needs.",
        "A derived class that overrides every pure virtual function becomes **concrete** and can be instantiated. One that misses even a single one stays abstract, and the error surfaces the first time somebody tries to construct it.",
        "**The `= 0` is not an assignment and does not mean null.** It is simply the syntax the language chose; Stroustrup has said as much, having picked it over a new keyword. Read it as \"no implementation\".",
        "Notice what this buys you beyond documentation. `Shape` being abstract means `void draw(Shape s)` will not compile — the language physically prevents the slicing that lesson 5 is about. **An abstract base makes the most common polymorphism bug impossible to write.**",
      ],
      examples: [
        {
          id: "abstract-shape",
          title: "An abstract base with a mix of pure and defaulted virtuals",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;

    virtual double area() const = 0;       // = 0 : no implementation here
    virtual const char* name() const = 0;

    // Not pure: a default every shape can use, and some may override.
    virtual void describe() const {
        std::cout << "  " << name() << " with area " << area() << '\\n';
    }
};

class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return 3.14159265358979 * r_ * r_; }
    const char* name() const override { return "circle"; }
private:
    double r_;
};

class Rect : public Shape {
public:
    Rect(double w, double h) : w_(w), h_(h) {}
    double area() const override { return w_ * h_; }
    const char* name() const override { return "rect"; }
    void describe() const override {
        std::cout << "  rect " << w_ << "x" << h_ << " = " << area() << '\\n';
    }
private:
    double w_, h_;
};

int main() {
    // Shape s;                      // ERROR: cannot instantiate abstract class
    // std::vector<Shape> shapes;    // fine to declare, impossible to fill

    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(1.0));
    shapes.push_back(std::make_unique<Rect>(2.0, 3.0));

    double total = 0.0;
    for (const auto& s : shapes) {
        s->describe();
        total += s->area();
    }
    std::cout << "total = " << total << '\\n';
}`,
          output: `  circle with area 3.14159
  rect 2x3 = 6
total = 9.14159`,
          explanation:
            "**`Shape` declares what a shape must do and implements almost none of it.** `area` and `name` are pure, so every shape must answer them; `describe` is an ordinary virtual with a working default, which `Circle` accepts and `Rect` replaces. That mix is the normal shape of a good abstract base — a small set of pure operations the subclass must supply, and some behaviour built on top of them that most subclasses can inherit unchanged.",
        },
      ],
      pitfalls: [
        {
          title: "Read the error properly — it names the functions you forgot",
          body: "GCC does not just say the type is abstract, it lists exactly which pure virtuals remain unimplemented:\n\n`error: cannot declare variable 's' to be of abstract type 'Shape'`\n`note:   because the following virtual functions are pure within 'Shape':`\n`note:     'virtual double Shape::area() const'`\n`note:     'virtual const char* Shape::name() const'`\n\nWhen this appears for a class you *thought* was concrete, the usual cause is not a forgotten function but a signature that does not quite match — a missing `const`, most often — so your function did not override anything and the pure one is still there. Lesson 6's `override` turns that into a much clearer error.",
        },
      ],
    },
    {
      id: "pure-with-body",
      heading: "A pure virtual function may still have a body",
      body: [
        "This surprises people, and it is occasionally exactly what you want: **`= 0` and having an implementation are independent.** You can declare a function pure *and* define it out of line.",
        "The `= 0` forces every concrete subclass to declare the function — to make a deliberate decision about it. The body provides a shared default that a subclass can opt into explicitly, by calling `Base::f()`.",
        "The distinction is \"you must choose, and here is something to help you\" rather than \"here is a default you will inherit by accident\". Use it when silently inheriting the base behaviour would be a likely mistake.",
        "**A pure virtual destructor is the one case you will meet often.** If you want a class to be abstract but have no function that naturally ought to be pure, declaring `virtual ~Base() = 0;` does it — and then you *must* provide a body, because derived destructors always call the base one.",
      ],
      examples: [
        {
          id: "pure-with-impl",
          title: "Forced to decide, but given something to call",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

// A pure virtual function MAY have a body. Declaring it pure forces every
// concrete subclass to make a deliberate decision; the body offers a default
// they must opt into explicitly.
class Logger {
public:
    virtual ~Logger() = default;
    virtual void log(const std::string& msg) = 0;
};

// The body is defined out of line -- note there is no '= 0' here.
void Logger::log(const std::string& msg) {
    std::cout << "  [default] " << msg << '\\n';
}

class TimestampLogger : public Logger {
public:
    void log(const std::string& msg) override {
        std::cout << "  [12:00] ";
        Logger::log(msg);      // explicitly opt in to the shared default
    }
};

class SilentLogger : public Logger {
public:
    void log(const std::string&) override { /* deliberately nothing */ }
};

int main() {
    TimestampLogger t;
    SilentLogger    s;

    Logger* loggers[] = {&t, &s};
    for (Logger* l : loggers) l->log("disk almost full");

    std::cout << "done\\n";
}`,
          output: `  [12:00]   [default] disk almost full
done`,
          explanation:
            "**`SilentLogger` had to write `log` and decide to do nothing** — it could not quietly inherit a default that logs. `TimestampLogger` adds a prefix and then calls `Logger::log` to reuse the shared body. The out-of-line definition carries no `= 0`; the purity is declared once, in the class. Only one line of output appears from the loop because the silent logger produced none, which is exactly the deliberate choice it was forced to make.",
        },
      ],
    },
    {
      id: "interfaces",
      heading: "Interfaces, as C++ spells them",
      body: [
        "C++ has no `interface` keyword. The equivalent is a convention: **an abstract class with no data members, no constructors worth speaking of, all functions pure virtual, and a virtual destructor.**",
        "The rules for writing one well are short.",
        "**Give it a virtual destructor** — public and virtual, or protected and non-virtual. Lesson 5 explains why this is not optional.",
        "**Give it no data.** State belongs in implementations. An interface with members is a base class pretending to be an interface, and it constrains every implementer for no reason.",
        "**Keep it small.** An interface with fifteen functions forces every implementation, including test fakes, to write fifteen functions. Narrow interfaces are easier to implement, easier to fake, and easier to reason about.",
        "**Depend on it, not on concrete types.** This is the payoff. When a class takes a `const Clock&` rather than a `SystemClock&`, its tests can hand it a clock they control instead of waiting for real time to pass. The same trick swaps a real database for an in-memory one, a network call for a canned response, a random source for a fixed sequence.",
      ],
      examples: [
        {
          id: "interface-testing",
          title: "The interface that makes a test possible",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

// An interface: pure virtual functions and a virtual destructor, no state.
class Clock {
public:
    virtual ~Clock() = default;
    virtual int nowSeconds() const = 0;
};

// The production implementation would read the system clock.
class SystemClock : public Clock {
public:
    int nowSeconds() const override { return 1'700'000'000; }
};

// The test implementation is three lines and needs no waiting.
class FakeClock : public Clock {
public:
    explicit FakeClock(int t) : t_(t) {}
    int nowSeconds() const override { return t_; }
    void advance(int by) { t_ += by; }
private:
    int t_;
};

// Business logic depends on the interface, never on a concrete clock.
class SessionCache {
public:
    SessionCache(const Clock& clock, int ttl) : clock_(clock), ttl_(ttl) {}

    void put(std::string key) {
        entries_.push_back({std::move(key), clock_.nowSeconds()});
    }

    int liveCount() const {
        int n = 0;
        for (const auto& e : entries_)
            if (clock_.nowSeconds() - e.storedAt < ttl_) ++n;
        return n;
    }

private:
    struct Entry { std::string key; int storedAt; };
    const Clock&       clock_;
    int                ttl_;
    std::vector<Entry> entries_;
};

int main() {
    FakeClock clock{0};
    SessionCache cache{clock, /*ttl=*/60};

    cache.put("alice");
    cache.put("bob");
    std::cout << "live now:        " << cache.liveCount() << '\\n';

    clock.advance(30);
    std::cout << "live after 30s:  " << cache.liveCount() << '\\n';

    clock.advance(31);
    std::cout << "live after 61s:  " << cache.liveCount() << '\\n';
}`,
          output: `live now:        2
live after 30s:  2
live after 61s:  0`,
          explanation:
            "**A cache expiry test that runs instantly and deterministically.** Had `SessionCache` called `std::chrono::system_clock::now()` directly, testing the 60-second TTL would mean either sleeping for a minute or not testing it. The one-line `Clock` interface turned time into something the test controls. This is dependency inversion, and it is the most valuable everyday use of abstract classes — not modelling shapes and animals, but cutting a seam through code so the awkward parts can be replaced.",
        },
      ],
      pitfalls: [
        {
          title: "Storing a reference member means the referent must outlive the object",
          body: "`SessionCache` holds a `const Clock&`, which is cheap and makes the dependency explicit, but it also makes the cache non-assignable and requires the clock to outlive it. That is fine here — both are locals in `main` and the clock is declared first, so it is destroyed last. When lifetimes are less obvious, take a `std::shared_ptr<const Clock>` for shared ownership, or a `std::unique_ptr<Clock>` if the object should own its dependency. Do not reach for a raw owning pointer.",
        },
      ],
    },
    {
      id: "nvi",
      heading: "The non-virtual interface idiom",
      body: [
        "There is a tension in a design like `Exporter::exportRows`: the base class wants to enforce something — validate the input, open and close the file, log the timing — but the subclass needs to supply the middle. If the whole function is virtual, an override can skip all of it, and eventually one will.",
        "**The non-virtual interface idiom separates the two roles.** The public function is *non-virtual*, so nobody can replace it; it owns the invariants. It calls a *private virtual* function as its customisation point. Subclasses override the hook and cannot touch the wrapper.",
        "**A private virtual function can still be overridden.** Access control and virtual dispatch are independent in C++ — private controls who may *call* the function, not who may *override* it. That is precisely what makes this work: derived classes implement it, and only the base calls it.",
        "The benefits compound. The base can add a precondition check, logging or a lock later without touching a single subclass. The contract lives in one place. And each side of the boundary — the invariant and the varying step — is documented by the code itself.",
        "Templates offer the same shape without dispatch: this is the *template method pattern*, and the standard library uses NVI throughout `std::pmr::memory_resource`, whose public `allocate` calls a private virtual `do_allocate`.",
      ],
      examples: [
        {
          id: "nvi",
          title: "Public non-virtual wrapper, private virtual hook",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <string>

// Non-Virtual Interface: the PUBLIC function is non-virtual and owns the
// invariants; the customisation point is a PRIVATE virtual the base calls.
class Exporter {
public:
    virtual ~Exporter() = default;

    // Public, non-virtual, and the only way in. Subclasses cannot skip any
    // of this, because they cannot override it.
    std::string exportRows(int rows) {
        if (rows < 0) throw std::invalid_argument("rows must be >= 0");
        std::cout << "  [base] validated, opening\\n";
        std::string body = writeBody(rows);          // <-- the hook
        std::cout << "  [base] closing, " << body.size() << " bytes\\n";
        return body;
    }

private:
    // Private: subclasses override it, nobody else can call it.
    virtual std::string writeBody(int rows) = 0;
};

class CsvExporter : public Exporter {
private:
    std::string writeBody(int rows) override {
        std::string out;
        for (int i = 0; i < rows; ++i) out += std::to_string(i) + ",x\\n";
        return out;
    }
};

class JsonExporter : public Exporter {
private:
    std::string writeBody(int rows) override {
        std::string out = "[";
        for (int i = 0; i < rows; ++i) out += (i ? "," : "") + std::to_string(i);
        return out + "]";
    }
};

int main() {
    CsvExporter  csv;
    JsonExporter json;

    Exporter* all[] = {&csv, &json};
    for (Exporter* e : all) {
        std::cout << e->exportRows(3) << '\\n';
    }

    try {
        csv.exportRows(-1);
    } catch (const std::invalid_argument& e) {
        std::cout << "  rejected: " << e.what() << '\\n';
    }
}`,
          output: `  [base] validated, opening
  [base] closing, 12 bytes
0,x
1,x
2,x

  [base] validated, opening
  [base] closing, 7 bytes
[0,1,2]
  rejected: rows must be >= 0`,
          explanation:
            "**Both exporters got the validation and the open/close messages, and neither could have opted out.** The negative-row check ran for `CsvExporter` even though `CsvExporter` contains nothing but a body writer. Note that `writeBody` is `private` in both the base and the derived classes and is still overridden and still dispatched — access control and virtual dispatch really are independent. If `exportRows` later needs a mutex or a metric, it goes in one place.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a pure virtual function, and what does it do to the class?",
      answer:
        "A virtual function declared `= 0`, meaning the base provides no implementation and every concrete subclass must supply one. A class with at least one becomes abstract, which the compiler enforces by refusing to let you create an object of it — no variables, no `new`, no vector elements. Pointers and references to it are still fine, which is all polymorphism needs. A derived class that overrides every pure virtual becomes concrete; miss one and it stays abstract. The `= 0` is just syntax, not an assignment and nothing to do with null.",
    },
    {
      question: "Can a pure virtual function have an implementation? Why would you want that?",
      answer:
        "Yes — purity and having a body are independent. The `= 0` forces every concrete subclass to declare the function and make a deliberate decision; the body gives them a shared default they must opt into explicitly with a qualified `Base::f()` call. Use it where silently inheriting the base behaviour would probably be a mistake. The case you meet most often is a pure virtual destructor, used to make a class abstract when no other function naturally should be — and there the body is mandatory, because derived destructors always call the base one.",
    },
    {
      question: "How do you write an interface in C++?",
      answer:
        "As an abstract class with all functions pure virtual, no data members, and a destructor that is either public and virtual or protected and non-virtual. Keep it narrow, because every implementation — including every test fake — has to implement all of it. The value is that code depending on the interface rather than a concrete type can have its dependencies swapped: a fake clock instead of the system clock, an in-memory store instead of a database. That is dependency inversion, and it is what makes otherwise untestable code testable.",
    },
    {
      question: "What is the non-virtual interface idiom, and what problem does it solve?",
      answer:
        "The public function is non-virtual and owns the invariants — validation, setup and teardown, logging, locking — and it calls a private virtual function as its customisation point. Subclasses override the hook and cannot replace the wrapper, so they cannot skip the steps the base requires. It solves the problem that a fully virtual public function can be overridden by something that forgets the contract. It also means the base can add a precondition or a metric later without touching any subclass. The standard library uses it in `std::pmr::memory_resource`, where public `allocate` calls private `do_allocate`.",
    },
    {
      question: "Can a private virtual function be overridden by a derived class?",
      answer:
        "Yes. Access control and virtual dispatch are entirely independent in C++. `private` governs who may *name and call* the function, not who may override it, so a derived class can provide an implementation it is not allowed to call itself. That is exactly what makes the non-virtual interface idiom work: the hook is private, subclasses implement it, and only the base class ever invokes it. A derived class that wants to call the base version needs it to be `protected` instead.",
    },
    {
      question: "Why does making a base class abstract prevent object slicing?",
      answer:
        "Slicing happens when a derived object is copied into a base *object* — passing by value, assigning to a base variable, or storing in a `std::vector<Base>`. All of those require constructing a `Base`, and an abstract class cannot be constructed, so every one of them becomes a compile error rather than silent data loss. So `void draw(Shape s)` will not compile when `Shape` is abstract, while it compiles and quietly misbehaves when `Shape` is concrete. It is a good reason to make a polymorphic base abstract even when you could give every function a default.",
    },
  ],
  takeaways: [
    "`= 0` marks a function pure; a class with any pure virtual is abstract and cannot be instantiated",
    "Pointers and references to an abstract class are fine — that is all polymorphism needs",
    "A subclass that misses even one pure virtual stays abstract",
    "GCC's error lists exactly which pure virtuals are unimplemented — usually a signature mismatch, not a forgotten function",
    "A pure virtual function may still have a body, offering a default subclasses must opt into",
    "A pure virtual destructor makes a class abstract and must be given a definition",
    "An interface is an abstract class with no data, all-pure functions, and a virtual destructor",
    "Depending on an interface rather than a concrete type is what lets tests substitute a fake",
    "NVI: public non-virtual function owns the invariants, private virtual is the customisation point",
    "Access control and virtual dispatch are independent — a private virtual can still be overridden",
    "An abstract base makes slicing a compile error instead of silent data loss",
  ],
  status: "available",
};
