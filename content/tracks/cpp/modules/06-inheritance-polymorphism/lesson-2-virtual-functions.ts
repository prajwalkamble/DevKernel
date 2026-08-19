import type { Lesson } from "@/content/types";

export const virtualFunctionsLesson: Lesson = {
  id: "cpp-virtual-functions",
  slug: "virtual-functions-and-dynamic-dispatch",
  moduleSlug: "inheritance-polymorphism",
  title: "Virtual Functions & Dynamic Dispatch",
  summary:
    "One keyword changes which function runs. Static binding by the declared type against dynamic binding by the real one, why dispatch only happens through a pointer or reference, and the two instructions a virtual call actually compiles to.",
  estimatedMinutes: 35,
  objectives: [
    "Distinguish an object's static type from its dynamic type",
    "Explain what `virtual` changes about a call",
    "Say why polymorphism requires a pointer or reference",
    "Call a base implementation deliberately with a qualified name",
    "Read the assembly of a virtual call and say what each instruction does",
  ],
  sections: [
    {
      id: "two-types",
      heading: "Static type and dynamic type",
      body: [
        "Every expression in C++ has two types, and the whole of polymorphism is about the gap between them.",
        "**The static type** is what the declaration says, and it is fixed at compile time. In `Animal& a = myDog;`, the static type of `a` is `Animal&`.",
        "**The dynamic type** is what the object really is at run time. In that same line, the dynamic type is `Dog`.",
        "For a non-virtual function, **the compiler picks the function from the static type**, because that is all it has. It sees `a.speak()` where `a` is declared `Animal&`, emits a call to `Animal::speak`, and that decision is baked into the executable. It does not matter that a `Dog` turns up at run time — the choice has already been made.",
        "This is *static binding*, and for most functions it is exactly what you want: it is fast, it is predictable, and it can be inlined.",
      ],
      examples: [
        {
          id: "static-binding",
          title: "No `virtual`: the declared type wins",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

struct Animal {
    std::string name;
    // No 'virtual' anywhere in this hierarchy.
    void speak() const { std::cout << name << " makes a sound\\n"; }
};

struct Dog : Animal {
    void speak() const { std::cout << name << " says woof\\n"; }
};

int main() {
    Dog d{{"Rex"}};

    d.speak();          // static type is Dog

    Animal& a = d;      // same object, seen as an Animal
    a.speak();          // static type is Animal& -> Animal::speak

    Animal* p = &d;
    p->speak();         // static type is Animal* -> Animal::speak
}`,
          output: `Rex says woof
Rex makes a sound
Rex makes a sound`,
          explanation:
            "**All three lines act on the same `Dog`, and two of them run the `Animal` version.** `Dog::speak` does not *override* `Animal::speak` here — with no `virtual`, it merely **hides** it, which is a name-lookup rule rather than a dispatch one. The object never changed; only the name the code used to refer to it did. This is the behaviour `virtual` exists to change.",
        },
      ],
    },
    {
      id: "virtual",
      heading: "What `virtual` changes",
      body: [
        "Mark a function `virtual` in the base class and the decision moves from compile time to run time. **The call now consults the object rather than the declaration.**",
        "Three details are worth stating precisely.",
        "**`virtual` goes in the base class**, and it is inherited. Once a function is virtual it stays virtual in every derived class, whether or not you repeat the keyword. You should still write `override` on the derived declaration — lesson 6 explains what that buys you.",
        "**The signature must match exactly** for one function to override another: same name, same parameter types, same const-qualification, same ref-qualification. A near miss creates a new, unrelated function and silently gives you the base behaviour. This is the single most common bug in this module, and `override` is the fix.",
        "**The return type must match**, with one deliberate exception — covariant return types, where an override may return a *more derived* pointer or reference. Lesson 6 uses that to write a proper `clone`.",
      ],
      examples: [
        {
          id: "dynamic-dispatch",
          title: "One call site, four different functions",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Animal {
public:
    explicit Animal(std::string name) : name_(std::move(name)) {}
    virtual ~Animal() = default;

    // 'virtual' here is what makes the decision happen at run time.
    virtual void speak() const { std::cout << name_ << " makes a sound\\n"; }

    const std::string& name() const { return name_; }

private:
    std::string name_;
};

class Dog : public Animal {
public:
    using Animal::Animal;
    void speak() const override { std::cout << name() << " says woof\\n"; }
};

class Cat : public Animal {
public:
    using Animal::Animal;
    void speak() const override { std::cout << name() << " says meow\\n"; }
};

class Fox : public Animal {
public:
    using Animal::Animal;
    void speak() const override {
        Animal::speak();                        // explicitly the base version
        std::cout << "  ...ring-ding-ding\\n";   // then add to it
    }
};

int main() {
    std::vector<std::unique_ptr<Animal>> zoo;
    zoo.push_back(std::make_unique<Dog>("Rex"));
    zoo.push_back(std::make_unique<Cat>("Mog"));
    zoo.push_back(std::make_unique<Fox>("Ylvis"));
    zoo.push_back(std::make_unique<Animal>("Thing"));

    // One call site. Four different functions run.
    for (const auto& a : zoo) a->speak();

    // Qualification defeats dispatch on purpose.
    std::cout << "--\\n";
    zoo[0]->Animal::speak();
}`,
          output: `Rex says woof
Mog says meow
Ylvis makes a sound
  ...ring-ding-ding
Thing makes a sound
--
Rex makes a sound`,
          explanation:
            "**`a->speak()` is one line of code that runs four different functions.** That is the point of the whole module: `main` knows nothing about `Dog`, `Cat` or `Fox`, and adding a fifth animal requires no change to this loop at all. Two other things to notice — `Fox::speak` calls `Animal::speak()` explicitly to extend rather than replace it, which is the normal way to build on a base implementation; and the final line shows that **a qualified call, `p->Animal::speak()`, suppresses dispatch entirely** and always runs the named version.",
        },
      ],
      pitfalls: [
        {
          title: "`using Animal::Animal;` inherits constructors, it does not inherit anything else",
          body: "The `using Animal::Animal;` line in `Dog` is an *inheriting constructor* declaration: it makes `Animal`'s constructors usable as `Dog`'s, which saves writing a forwarding constructor for each one. It is unrelated to the `using Base::f;` in lesson 6, which reverses name hiding for ordinary member functions. Same syntax, two different jobs, and both are worth recognising on sight.",
        },
      ],
    },
    {
      id: "pointer-or-reference",
      heading: "Only through a pointer or a reference",
      body: [
        "**Dynamic dispatch requires indirection.** A `Base*` or a `Base&` can refer to an object whose real type is something else; a `Base` *object* cannot. It is a `Base`, exactly and only.",
        "This is not an arbitrary rule, it is a consequence of how objects are stored. A `Base` variable is allocated with `sizeof(Base)` bytes; a `Derived` will not fit. So when you assign a `Derived` to a `Base` variable, the compiler does not store a `Derived` — it copies the base subobject and discards everything else. That is **object slicing**, and lesson 5 covers the damage properly.",
        "The practical rule follows directly: **polymorphic objects are held by pointer or reference, and passed by reference.** Take parameters as `const Base&`, store them as `std::unique_ptr<Base>` or `std::shared_ptr<Base>`, and never as a `std::vector<Base>`.",
      ],
      examples: [
        {
          id: "through-reference",
          title: "Dispatch through a reference",
          lang: "cpp",
          code: `#include <iostream>

struct Shape {
    virtual ~Shape() = default;
    virtual double area() const = 0;
};

struct Circle : Shape {
    double r;
    explicit Circle(double radius) : r(radius) {}
    double area() const override { return 3.14159265358979 * r * r; }
};

// The parameter is a reference, so dispatch is dynamic.
double totalByRef(const Shape& s) { return s.area(); }

int main() {
    Circle c{2.0};

    std::cout << "through a reference: " << totalByRef(c) << '\\n';

    const Shape& s = c;
    std::cout << "through a reference: " << s.area() << '\\n';

    // Dispatch on a concrete object: the type is known, no vtable needed.
    std::cout << "on the object direct: " << c.area() << '\\n';
}`,
          output: `through a reference: 12.5664
through a reference: 12.5664
on the object direct: 12.5664`,
          explanation:
            "**All three agree, but they do not all get there the same way.** The first two go through a reference and must consult the object at run time. The third acts on `c` directly, whose type the compiler knows exactly, so no lookup is needed. Note also that `double totalByValue(Shape s)` would not even compile here — `Shape` is abstract, so the language physically prevents the slice. That is one of the quieter arguments for abstract bases in lesson 4.",
        },
      ],
    },
    {
      id: "what-it-compiles-to",
      heading: "What the call actually compiles to",
      body: [
        "A virtual call is not expensive or mysterious, and it is worth seeing the instructions once so you stop guessing about the cost.",
        "The object carries a hidden pointer — the *vptr* — to a table of function addresses for its class, the *vtable*. A virtual call loads the vptr, indexes the table at a fixed offset chosen at compile time, and calls through it. **Two memory loads and an indirect branch.**",
        "The assembly below is real GCC 14 output at `-O2`. The compiler is passed only the declarations, so it cannot see the bodies and cannot cheat.",
        "The interesting result is the second one. `viaConcrete` takes a `const Square&` — a fully concrete type — and *still* dispatches virtually, because a `Square&` may refer to something derived from `Square`. Add `final` to the class and the compiler knows no such thing can exist, so the call collapses into a direct jump. **That is devirtualization, and it is the concrete reason `final` sometimes shows up in performance work.**",
      ],
      examples: [
        {
          id: "virtual-asm",
          title: "The same source, three levels of knowledge",
          lang: "asm",
          code: `; int viaBase(const Shape& s) { return s.area(); }
viaBase(Shape const&):
        mov     rax, QWORD PTR [rdi]      ; load the vptr from the object
        jmp     [QWORD PTR 16[rax]]       ; call through vtable slot 2

; int viaConcrete(const Square& s) { return s.area(); }
;   Square is NOT final -- a Square& could refer to something derived
viaConcrete(Square const&):
        mov     rax, QWORD PTR [rdi]      ; identical: still a virtual call
        jmp     [QWORD PTR 16[rax]]

; struct Square final : Shape { ... };
; int viaConcreteFinal(const Square& s) { return s.area(); }
viaConcreteFinal(Square const&):
        jmp     Square::area() const      ; devirtualized: a direct jump

; int onObject() { Square s; s.side = 3; return s.area(); }
onObject():
        sub     rsp, 24
        lea     rax, vtable for Square[rip+16]
        mov     rdi, rsp
        mov     QWORD PTR [rsp], rax      ; the constructor installs the vptr
        mov     DWORD PTR 8[rsp], 3
        call    Square::area() const      ; exact type known: direct call
        add     rsp, 24
        ret`,
          output: `$ g++ -std=c++20 -O2 -S -masm=intel   # GCC 14, symbols demangled`,
          explanation:
            "**A virtual call is two loads and an indirect jump — not a lookup, not a search.** The `16` is a fixed offset computed at compile time, because slot 2 of `Shape`'s vtable is always `area`. The real cost is not the instructions but the *indirect branch*: the CPU must predict it, and a call site that sees many different types will mispredict. It also blocks inlining, which is usually the larger loss. Compare the last case: with the exact type known, the call is direct, and note the constructor writing the vptr into the object — lesson 3 takes that apart.",
        },
      ],
      pitfalls: [
        {
          title: "\"Virtual calls are slow\" is the wrong summary",
          body: "The dispatch itself is a couple of instructions and will not show up in a profile. What costs is the lost inlining — a small function that could have been folded into its caller now cannot be — and branch misprediction at call sites that see many types. Both effects only matter in hot loops. Do not contort a design to avoid `virtual` before you have measured; and when you have measured, the tools are `final`, making the type concrete at the call site, or replacing dispatch with a `std::variant` and `std::visit`.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between an object's static type and its dynamic type?",
      answer:
        "The static type is what the declaration says, fixed at compile time; the dynamic type is what the object actually is at run time. For `Animal& a = myDog;` the static type is `Animal&` and the dynamic type is `Dog`. Non-virtual calls are resolved from the static type at compile time, so `a.speak()` would call `Animal::speak`. Virtual calls consult the object at run time and get `Dog::speak`. The two types can only differ through a pointer or reference — an actual `Animal` variable has dynamic type `Animal` and nothing else.",
    },
    {
      question: "Why does polymorphism only work through pointers and references?",
      answer:
        "Because a `Base` variable is allocated exactly `sizeof(Base)` bytes, and a derived object does not fit. Assigning a derived object to a base variable copies only the base subobject and discards the rest — object slicing — so there is no derived object left to dispatch to, and the vptr is the base's. A pointer or reference adds a level of indirection: it can refer to an object of any derived type, stored elsewhere at its real size, so the dynamic type survives and dispatch is meaningful. Hence the rule that polymorphic types are passed by `const Base&` and stored as `unique_ptr<Base>`.",
    },
    {
      question: "How does a virtual call work at the instruction level, and what does it cost?",
      answer:
        "Each polymorphic object holds a hidden vptr pointing to its class's vtable, an array of function addresses. A virtual call loads the vptr from the object, loads the function address from a fixed compile-time offset into that table, and branches through it — two loads and an indirect jump. The direct cost is negligible. The real costs are that the compiler cannot inline through it, and that the indirect branch must be predicted, so a call site seeing many different dynamic types will mispredict. Neither matters outside hot code.",
    },
    {
      question: "What is devirtualization, and how can you help the compiler do it?",
      answer:
        "It is the optimisation that turns a virtual call into a direct one when the compiler can prove the dynamic type. It happens automatically when you call on a concrete local object. It does *not* happen through a reference to a non-final class, because a `Square&` may refer to something derived from `Square` — GCC still emits the indirect call. Marking the class or the function `final` tells the compiler no further override can exist, and the call collapses to a direct jump. Link-time optimisation and profile-guided optimisation can also devirtualize by seeing the whole program.",
    },
    {
      question: "How do you call the base class version of a virtual function?",
      answer:
        "Qualify the name: `Animal::speak()` inside a member function, or `p->Animal::speak()` through a pointer. A qualified call suppresses dynamic dispatch entirely and always runs the named implementation. The common use is an override that extends rather than replaces the base behaviour — it does the base's work first, then adds its own. It is also how a derived destructor's chain works, though the compiler does that part for you.",
    },
    {
      question: "If a derived class defines a function with the same name as a non-virtual base function, what happens?",
      answer:
        "It hides the base version rather than overriding it. Calls through a `Derived` find the derived function by name lookup; calls through a `Base*` or `Base&` are statically bound to the base version. So the same object behaves differently depending on which type you refer to it through, which is almost always a bug. Note that hiding is name-based, not signature-based — a derived function with the same name hides *every* base overload of that name, even ones with different parameters. `using Base::f;` brings them back.",
    },
  ],
  takeaways: [
    "The static type is what the declaration says; the dynamic type is what the object really is",
    "Without `virtual`, the compiler picks the function from the static type and bakes it in",
    "`virtual` moves the decision to run time, consulting the object rather than the declaration",
    "`virtual` is written in the base and is inherited by every override whether repeated or not",
    "An override must match the signature exactly, including `const` — a near miss silently creates a new function",
    "Dispatch needs a pointer or reference; a base *object* has no room for a derived one",
    "`p->Base::f()` suppresses dispatch and always calls the named version",
    "A virtual call is two loads and an indirect jump — the cost is lost inlining, not the dispatch",
    "A reference to a non-final class still dispatches virtually; `final` enables devirtualization",
  ],
  status: "available",
};
