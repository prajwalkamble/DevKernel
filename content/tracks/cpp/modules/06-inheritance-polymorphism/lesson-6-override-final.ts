import type { Lesson } from "@/content/types";

export const overrideFinalLesson: Lesson = {
  id: "cpp-override-final",
  slug: "override-final-and-silent-non-overrides",
  moduleSlug: "inheritance-polymorphism",
  title: "override, final & the Overrides That Silently Are Not",
  summary:
    "A near-miss signature does not fail — it quietly creates an unrelated function and you get the base behaviour forever. `override` turns every one of those into a compile error. Plus `final`, name hiding, covariant returns, and the default argument that comes from the wrong class.",
  estimatedMinutes: 35,
  objectives: [
    "List the ways a signature can miss and still compile",
    "Use `override` on every override, including destructors",
    "Use `final` on classes and functions, and say what it buys",
    "Recognise name hiding and fix it with `using Base::f`",
    "Write a covariant `clone` and use it to copy a polymorphic collection",
    "Explain why default arguments on virtual functions are a trap",
  ],
  sections: [
    {
      id: "silent-failure",
      heading: "The near miss",
      body: [
        "Lesson 2 said an override must match the base signature exactly. Here is what \"exactly\" means, and what happens when you are one character off.",
        "**A derived function whose signature does not match does not override anything.** It is simply a new function that happens to share a name. The base version stays in the vtable, calls through a `Base*` keep running it, and nothing anywhere reports a problem.",
        "The ways to miss are all easy to make and hard to see in review.",
        "**Dropping `const`.** `void draw()` does not override `void draw() const`. This is the most common one by a wide margin.",
        "**A parameter type that converts.** `void scale(float)` does not override `void scale(double)`. Because the types are implicitly convertible, every call site still compiles.",
        "**A typo in the name.** `drow` for `draw`.",
        "**A different return type**, other than the covariant case below.",
        "**Different ref-qualifiers**, or a mismatch in `noexcept` in the direction the language cares about.",
      ],
      examples: [
        {
          id: "near-miss",
          title: "Three functions that look like overrides and are not",
          lang: "cpp",
          code: `#include <iostream>

struct Base {
    virtual ~Base() = default;
    virtual void draw() const  { std::cout << "  Base::draw\\n"; }
    virtual void scale(double) { std::cout << "  Base::scale\\n"; }
};

// Every one of these LOOKS like an override. None of them is.
struct Derived : Base {
    void draw()          { std::cout << "  Derived::draw\\n"; }   // lost const
    void scale(float)    { std::cout << "  Derived::scale\\n"; }  // float != double
    void drow() const    { std::cout << "  Derived::drow\\n"; }   // typo
};

int main() {
    Derived d;
    Base& b = d;

    b.draw();        // Base::draw  -- Derived::draw is a different function
    b.scale(2.0);    // Base::scale -- Derived::scale takes a float
}`,
          output: `$ g++ -std=c++20 -Wall -Wextra ...
warning: 'virtual void Base::scale(double)' was hidden [-Woverloaded-virtual=]
note:   by 'void Derived::scale(float)'
warning: 'virtual void Base::draw() const' was hidden [-Woverloaded-virtual=]
note:   by 'void Derived::draw()'

$ ./a.out
  Base::draw
  Base::scale`,
          explanation:
            "**Both calls ran the base implementation, and the program is perfectly well-formed.** GCC's `-Woverloaded-virtual` caught two of the three — but note it said nothing about `drow`, because a function with a name no base function shares hides nothing and looks entirely reasonable to the compiler. The warning is worth enabling and is not sufficient on its own.",
        },
      ],
    },
    {
      id: "override",
      heading: "`override` makes it a compile error",
      body: [
        "`override` is a contextual keyword placed after the parameter list and any `const`. It asserts: **this function overrides a virtual function in a base class.** If it does not, the program does not compile.",
        "It changes nothing at run time and costs nothing. It exists purely to make the compiler check the thing you already believed.",
        "**Put it on every override, without exception**, including destructors — `~Derived() override` fails to compile if the base destructor is not virtual, which catches lesson 5's bug from the derived side too.",
        "**Do not write `virtual` and `override` together.** `virtual` on an override is redundant, since virtualness is inherited, and the pair is noise. Write `virtual` in the base, `override` in every derived class.",
      ],
      examples: [
        {
          id: "override-errors",
          title: "The same three mistakes, now unbuildable",
          lang: "cpp",
          code: `#include <iostream>

struct Base {
    virtual ~Base() = default;
    virtual void draw() const  { std::cout << "  Base::draw\\n"; }
    virtual void scale(double) { std::cout << "  Base::scale\\n"; }
};

// The same three mistakes, with 'override' added.
struct Derived : Base {
    void draw() override        { }
    void scale(float) override  { }
    void drow() const override  { }
};

int main() {}`,
          output: `error: 'void Derived::draw()' marked 'override', but does not override
error: 'void Derived::scale(float)' marked 'override', but does not override
error: 'void Derived::drow() const' marked 'override', but does not override`,
          explanation:
            "**All three caught, including the typo the warning missed, and all three at compile time.** This is the highest value-per-keystroke rule in the module: seven characters per function converts a class of silent runtime misbehaviour into an immediate build failure. It also protects you against *future* changes — if someone adds `const` to the base signature later, every override that no longer matches fails to build instead of silently detaching.",
        },
      ],
    },
    {
      id: "final",
      heading: "`final`",
      body: [
        "`final` is the opposite assertion: **this cannot be overridden or derived from any further.**",
        "**On a virtual function**, `void f() final;` means no derived class may override `f`. It implies `override`, so a function marked `final` must itself be overriding something.",
        "**On a class**, `class Square final : public Shape` means nothing may derive from `Square` at all.",
        "There are two reasons to use it. The first is design: you are stating that a class or an algorithm step is not an extension point, and the compiler will enforce it. The second is performance — as lesson 2 demonstrated in the assembly, **a call through a reference to a `final` class devirtualizes into a direct jump**, because no further override can exist.",
        "Use it where you mean it, not by default. A `final` class cannot be extended by anyone, including for testing, and a base you sealed is a base nobody can adapt.",
      ],
      examples: [
        {
          id: "final-errors",
          title: "What `final` rejects",
          lang: "cpp",
          code: `struct Shape { virtual ~Shape() = default; virtual void f(); };

struct Square final : Shape { void f() override; };
struct Oops : Square { };                  // deriving from a final class

struct Locked : Shape { void f() final; }; // no further overrides of f
struct Sub : Locked { void f() override; };`,
          output: `error: cannot derive from 'final' base 'Square' in derived type 'Oops'
error: virtual function 'virtual void Sub::f()' overriding final function`,
          explanation:
            "**Both forms are enforced at compile time and produce clear messages.** `Square` is sealed as a whole; `Locked::f` is sealed as a single function while `Locked` itself stays open to derivation. The second form is the more interesting one in design terms — it lets a class say \"extend me, but this particular step is settled\", which pairs naturally with the non-virtual interface idiom from lesson 4.",
        },
      ],
    },
    {
      id: "name-hiding",
      heading: "Name hiding and `using Base::f`",
      body: [
        "This one is not about virtual functions at all, but it lands in the same place and surprises people just as often.",
        "**Name lookup stops at the first scope that contains the name.** If a derived class declares *any* member called `f`, the compiler stops looking as soon as it finds it, and every `Base::f` overload becomes invisible through the derived type — regardless of signature.",
        "So a derived class that adds one overload of `f` silently removes all the others. Calls that used to select `Base::f(double)` now convert their argument to fit the derived `f(int)`, or fail to compile.",
        "**The fix is `using Base::f;`** in the derived class, which pulls the entire base overload set back into scope so the derived declaration joins it rather than replacing it.",
      ],
      examples: [
        {
          id: "hiding",
          title: "One added overload, two removed",
          lang: "cpp",
          code: `#include <iostream>

struct Base {
    virtual ~Base() = default;
    void f(int)         { std::cout << "  Base::f(int)\\n"; }
    void f(double)      { std::cout << "  Base::f(double)\\n"; }
    void f(const char*) { std::cout << "  Base::f(const char*)\\n"; }
};

// Declaring ANY f hides EVERY Base::f, regardless of signature.
struct Hiding : Base {
    void f(int) { std::cout << "  Hiding::f(int)\\n"; }
};

// 'using' brings the whole overload set back into scope.
struct Fixed : Base {
    using Base::f;
    void f(int) { std::cout << "  Fixed::f(int)\\n"; }
};

int main() {
    std::cout << "Hiding:\\n";
    Hiding h;
    h.f(1);          // Hiding::f(int)
    h.f(3.14);       // NOT Base::f(double) -- converts to int!
    // h.f("text");  // ERROR: cannot convert const char* to int

    std::cout << "Fixed:\\n";
    Fixed x;
    x.f(1);          // Fixed::f(int)
    x.f(3.14);       // Base::f(double), as expected
    x.f("text");     // Base::f(const char*)
}`,
          output: `Hiding:
  Hiding::f(int)
  Hiding::f(int)
Fixed:
  Fixed::f(int)
  Base::f(double)
  Base::f(const char*)`,
          explanation:
            "**`h.f(3.14)` silently truncated to `3` and called the `int` overload** — no warning, no error, just a wrong answer where the base class would have been right. And `h.f(\"text\")` stopped compiling entirely, in a class that only *added* a function. `Fixed` differs by one line, `using Base::f;`, and behaves as anyone would expect. Note this hiding rule applies to non-virtual functions too — it is a name-lookup rule, entirely separate from dispatch.",
        },
      ],
    },
    {
      id: "covariant-and-defaults",
      heading: "Covariant returns, and the default argument trap",
      body: [
        "Two remaining details, one useful and one purely a hazard.",
        "**Covariant return types** are the one sanctioned exception to exact signature matching. If the base returns `Base*` or `Base&`, an override may return `Derived*` or `Derived&` — a *more* derived type. This is safe because anything expecting a `Base*` accepts a `Derived*`, and it lets a caller who knows the concrete type keep that knowledge.",
        "The classic use is a virtual `clone()`, which gives a hierarchy proper copy semantics and is the standard answer to the slicing problem from lesson 5. **Note that covariance does not apply to smart pointers** — `unique_ptr<Derived>` is not covariant with `unique_ptr<Base>`, because they are unrelated class types rather than pointers to related classes. So a `clone` returning `unique_ptr` must return `unique_ptr<Base>` in every override, which is what the example does and is fine in practice.",
        "**Default arguments on virtual functions are the trap.** Default arguments are substituted at compile time from the *static* type, while the function body is selected at run time from the *dynamic* type. Give the base and the override different defaults and you get the derived body running with the base's default — a combination neither class was written to expect.",
        "**The rule is simply not to do it.** Never give a virtual function a default argument, or if the hierarchy already has them, make sure every class uses the same value. Where a default is genuinely wanted, put it on a non-virtual public wrapper that forwards to the virtual one — which is the NVI idiom from lesson 4 solving yet another problem.",
      ],
      examples: [
        {
          id: "clone",
          title: "A covariant `clone`, copying a polymorphic collection",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;
    virtual std::unique_ptr<Shape> clone() const = 0;
    virtual std::string describe() const = 0;
};

class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    std::unique_ptr<Shape> clone() const override {
        return std::make_unique<Circle>(*this);
    }
    std::string describe() const override {
        return "circle r=" + std::to_string(static_cast<int>(r_));
    }
    void setRadius(double r) { r_ = r; }
private:
    double r_;
};

// 'final' on a class: nothing may derive from it, and calls devirtualize.
class Square final : public Shape {
public:
    explicit Square(double s) : s_(s) {}
    std::unique_ptr<Shape> clone() const override {
        return std::make_unique<Square>(*this);
    }
    std::string describe() const override {
        return "square s=" + std::to_string(static_cast<int>(s_));
    }
private:
    double s_;
};

int main() {
    std::vector<std::unique_ptr<Shape>> a;
    a.push_back(std::make_unique<Circle>(2.0));
    a.push_back(std::make_unique<Square>(3.0));

    // Deep copy the whole collection through clone().
    std::vector<std::unique_ptr<Shape>> b;
    for (const auto& s : a) b.push_back(s->clone());

    // Mutate the original to prove the copy is independent.
    static_cast<Circle*>(a[0].get())->setRadius(50.0);

    std::cout << "original:\\n";
    for (const auto& s : a) std::cout << "  " << s->describe() << '\\n';
    std::cout << "clone:\\n";
    for (const auto& s : b) std::cout << "  " << s->describe() << '\\n';
}`,
          output: `original:
  circle r=50
  square s=3
clone:
  circle r=2
  square s=3`,
          explanation:
            "**A deep copy of a polymorphic collection, with no slicing and no `if` on the type.** Each object knows how to copy itself, `make_unique<Circle>(*this)` invokes `Circle`'s ordinary copy constructor, and the clone is genuinely independent — mutating the original's radius to 50 left the copy at 2. This is the answer whenever you need value semantics over a hierarchy, and it is why `clone` appears in so many C++ codebases.",
        },
        {
          id: "default-args",
          title: "The derived body with the base's default",
          lang: "cpp",
          code: `#include <iostream>

struct Base {
    virtual ~Base() = default;
    virtual void report(int level = 1) const {
        std::cout << "  Base::report level=" << level << '\\n';
    }
};

struct Derived : Base {
    // Same signature, so this IS a real override. But the default differs.
    void report(int level = 99) const override {
        std::cout << "  Derived::report level=" << level << '\\n';
    }
};

int main() {
    Derived d;
    Base*   b = &d;

    d.report();      // static type Derived -> default 99
    b->report();     // Derived's BODY, but Base's DEFAULT
}`,
          output: `  Derived::report level=99
  Derived::report level=1`,
          explanation:
            "**The same object, the same function, two different results — and the second is a combination that appears nowhere in the source.** `Derived::report` was never written to be called with `1`. The default came from `Base` because the compiler chose it from the static type of `b`, while the body came from `Derived` because dispatch chose it from the dynamic type. `override` cannot help here: this genuinely *is* an override, and the signatures match. Do not put default arguments on virtual functions.",
        },
      ],
      pitfalls: [
        {
          title: "Covariance does not extend to smart pointers",
          body: "`virtual Derived* clone() const override` is legal where the base returns `Base*`, because the rule is defined in terms of pointers and references to classes. `virtual std::unique_ptr<Derived> clone() const override` is *not* legal where the base returns `std::unique_ptr<Base>` — those are two unrelated instantiations of a class template, and the language has no covariance rule for them. Every override must return `std::unique_ptr<Base>`. If you really want the derived static type back, the workaround is NVI: a public non-virtual `clone()` returning `unique_ptr<Derived>` that calls a private virtual `doClone()` returning `unique_ptr<Base>`.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does `override` do, and why should you always write it?",
      answer:
        "It asserts that the function overrides a virtual function in a base class, and the program fails to compile if it does not. It has no runtime effect and no cost. Without it, a signature that is one character off — a missing `const`, `float` instead of `double`, a typo — creates a new unrelated function, the base version stays in the vtable, and calls through a base pointer silently keep running the base behaviour with no error and often no warning. `override` converts that entire class of runtime bug into a build failure, and it also protects against later changes to the base signature detaching your overrides.",
    },
    {
      question: "Name the ways a derived function can fail to override a base virtual.",
      answer:
        "Differing const-qualification, which is the most common; a parameter type that is merely convertible rather than identical, like `float` against `double`; a misspelled name; a different return type outside the covariant exception; differing ref-qualifiers; and a `noexcept` mismatch in the direction the language cares about. All of them compile. GCC's `-Woverloaded-virtual` catches some, but not a typo'd name, since that hides nothing.",
    },
    {
      question: "What does `final` do, and when is it worth using?",
      answer:
        "On a virtual function it forbids further overriding, and it implies `override`, so the function must itself be overriding something. On a class it forbids deriving from the class at all. Two uses: expressing that something is not an extension point and having the compiler enforce it, and enabling devirtualization — a call through a reference to a `final` class compiles to a direct jump rather than an indirect one, because no further override can exist. Do not apply it by default, since a sealed class cannot be extended for testing or adaptation.",
    },
    {
      question: "What is name hiding, and how do you fix it?",
      answer:
        "Name lookup stops at the first scope containing the name, so declaring any member called `f` in a derived class hides every `Base::f` overload regardless of signature. A derived class that adds one overload therefore removes all the others: calls that used to pick `Base::f(double)` now convert to the derived `f(int)`, or stop compiling. The fix is `using Base::f;` in the derived class, which pulls the whole base overload set back into scope so the derived declaration joins it. It applies to non-virtual functions too — it is a name-lookup rule, unrelated to dispatch.",
    },
    {
      question: "What is a covariant return type, and does it work with `unique_ptr`?",
      answer:
        "It is the one exception to exact signature matching: if the base returns `Base*` or `Base&`, an override may return a pointer or reference to a more derived class. It is safe because anything expecting a `Base*` accepts a `Derived*`, and it lets callers who know the concrete type keep that information. It does *not* work with smart pointers — `unique_ptr<Derived>` and `unique_ptr<Base>` are unrelated class template instantiations, not pointers to related classes, so every override of a `clone` returning `unique_ptr<Base>` must return `unique_ptr<Base>`. The workaround, if you need the derived type, is a non-virtual wrapper over a private virtual.",
    },
    {
      question: "Why should a virtual function never have a default argument?",
      answer:
        "Because default arguments are resolved at compile time from the static type, while the body is selected at run time from the dynamic type. If a base declares `report(int = 1)` and an override declares `report(int = 99)`, then calling through a `Base*` runs the derived body with the value 1 — a combination neither class was written for, and one that appears nowhere in the source. `override` cannot catch it, because the signatures genuinely match. Either avoid defaults on virtual functions entirely, keep them identical across the hierarchy, or put the default on a non-virtual public wrapper that forwards to the virtual one.",
    },
  ],
  takeaways: [
    "A signature that misses by one character creates a new function, not an override, and compiles silently",
    "Dropping `const` is the most common near miss; a convertible parameter type is the sneakiest",
    "`override` makes every one of these a compile error, costs nothing, and should be on every override",
    "Write `override` on destructors too — it fails if the base destructor is not virtual",
    "Do not pair `virtual` with `override`; `virtual` belongs in the base only",
    "`final` seals a function or a class, and enables devirtualization through a reference",
    "Declaring any member `f` hides every base overload of `f` — fix with `using Base::f;`",
    "Covariant returns let an override return a more derived pointer or reference",
    "Covariance does not apply to `unique_ptr`; a virtual `clone` returns `unique_ptr<Base>` everywhere",
    "A virtual `clone` gives a hierarchy real copy semantics and is the standard answer to slicing",
    "Never give a virtual function a default argument — the default comes from the static type",
  ],
  status: "available",
};
