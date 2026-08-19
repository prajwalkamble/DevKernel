import type { Lesson } from "@/content/types";

export const publicInheritanceLesson: Lesson = {
  id: "cpp-public-inheritance",
  slug: "public-inheritance-and-is-a",
  moduleSlug: "inheritance-polymorphism",
  title: "Public Inheritance & the is-a Relationship",
  summary:
    "What `class Derived : public Base` actually builds in memory, the order constructors and destructors run in, what `protected` is for, and the substitution rule that decides whether inheritance is the right tool at all.",
  estimatedMinutes: 30,
  objectives: [
    "Describe the base subobject and where it sits in a derived object",
    "Give the exact order of construction and destruction across a hierarchy",
    "Choose correctly between `public`, `protected` and `private` members in a base class",
    "Explain why an upcast to a base pointer is always safe",
    "Apply the substitution rule to reject inheritance that does not model is-a",
  ],
  sections: [
    {
      id: "what-it-builds",
      heading: "What inheritance actually builds",
      body: [
        "`class Derived : public Base` says: **every `Derived` object contains a complete `Base` object inside it**, called the *base subobject*, and `Derived` adds its own members after it.",
        "That is the whole mechanism. Inheritance is not a copy of the base's code into the derived class; it is containment with a special relationship to the type system. The layout is the base subobject first, then the derived members — so the address of a `Derived` and the address of its `Base` subobject are the same address.",
        "**That shared address is why upcasting is free and always safe.** Converting a `Derived*` to a `Base*` needs no runtime work at all; the pointer already points at a valid `Base`. The compiler allows it implicitly, with no cast written, because it cannot fail. (Lesson 7 shows the one case where the address *does* have to move.)",
        "Going the other way — `Base*` to `Derived*` — is a different matter entirely, because a `Base*` might point at a plain `Base`, or at any of a dozen derived types. That conversion needs an explicit cast and a way to check, which is `dynamic_cast`.",
      ],
      examples: [
        {
          id: "layout",
          title: "The base subobject, and the address it shares",
          lang: "cpp",
          code: `#include <iostream>

struct Base {
    int a{1};
    void hello() const { std::cout << "Base::hello\\n"; }
};

// Derived contains a complete Base subobject, then adds its own members.
struct Derived : Base {
    int b{2};
};

int main() {
    Derived d;
    std::cout << d.a << ' ' << d.b << '\\n';   // a is inherited, b is its own
    d.hello();                                // so is hello()

    std::cout << "sizeof(Base)    = " << sizeof(Base) << '\\n';
    std::cout << "sizeof(Derived) = " << sizeof(Derived) << '\\n';

    Base* p = &d;                             // upcast: implicit, always safe
    std::cout << "same address: "
              << (static_cast<void*>(p) == static_cast<void*>(&d)) << '\\n';
}`,
          output: `1 2
Base::hello
sizeof(Base)    = 4
sizeof(Derived) = 8
same address: 1`,
          explanation:
            "**`sizeof(Derived)` is `sizeof(Base)` plus its own members** — the base is genuinely stored inside. `d.a` works because `a` lives in the base subobject, and `d.hello()` works because member functions are looked up through the base too. The last line prints `1`: the `Base*` and the `Derived*` are the same address, which is exactly why the upcast costs nothing.",
        },
      ],
    },
    {
      id: "construction-order",
      heading: "Construction and destruction order",
      body: [
        "Building a derived object happens strictly from the base outwards, and tearing one down happens strictly in reverse. The order is fixed by the standard, not by how you write the initialiser list.",
        "**Construction**: the base class constructor runs first — and within it, the base's own members are initialised before its body. Then the derived class's members are initialised, in *declaration order*. Then the derived constructor's body runs.",
        "**Destruction is the exact mirror**: the derived destructor body, then the derived members in reverse declaration order, then the base destructor body, then the base's members.",
        "The reason for this order is that it is the only one that is safe. The derived constructor's body may use inherited members, so the base must already be fully built; the derived destructor's body may use inherited members, so the base must not be torn down yet.",
        "**A base class constructor is chosen in the derived class's member initialiser list**, written as the class name: `Derived() : Base(args), member_(x) {}`. If you do not name it, the base's default constructor is called — and if it has none, that is a compile error.",
      ],
      examples: [
        {
          id: "order",
          title: "Every step, in order, both ways",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

struct Member {
    std::string tag;
    explicit Member(std::string t) : tag(std::move(t)) {
        std::cout << "  + member " << tag << '\\n';
    }
    ~Member() { std::cout << "  - member " << tag << '\\n'; }
};

struct Base {
    Member m{"base.m"};
    Base()  { std::cout << "  + Base body\\n"; }
    ~Base() { std::cout << "  - Base body\\n"; }
};

struct Derived : Base {
    Member m{"derived.m"};
    Derived()  { std::cout << "  + Derived body\\n"; }
    ~Derived() { std::cout << "  - Derived body\\n"; }
};

int main() {
    std::cout << "constructing\\n";
    {
        Derived d;
        std::cout << "alive\\n";
    }
    std::cout << "done\\n";
}`,
          output: `constructing
  + member base.m
  + Base body
  + member derived.m
  + Derived body
alive
  - Derived body
  - member derived.m
  - Base body
  - member base.m
done`,
          explanation:
            "**Base members, base body, derived members, derived body — then precisely the reverse.** Note that the base is completely finished, members and body, before the derived class's members are even initialised. That fact is what makes lesson 6's rule about calling virtual functions from a constructor necessary: while `Base`'s body is running, the `Derived` part of the object does not exist yet.",
        },
      ],
    },
    {
      id: "access",
      heading: "public, protected and private",
      body: [
        "Inheritance adds a third access level that only makes sense once there is a derived class.",
        "**`public`** — anyone can use it. This is the class's interface.",
        "**`protected`** — derived classes can use it, the outside world cannot. This is the interface offered specifically to subclasses.",
        "**`private`** — only the class itself (and its friends). Derived classes *inherit* private members, in the sense that they occupy space in the object, but cannot name them.",
        "**Prefer `private` to `protected` for data.** A protected data member is very nearly a public one: any code anywhere can derive from your class and then read and write it, so you have lost the ability to maintain an invariant. Protected *functions* are the better tool — they let a derived class perform a controlled operation without exposing the state behind it.",
        "There is also an inheritance *mode*, the `public` in `class D : public B`, which is separate from member access and caps how visible the inherited members are. **`public` inheritance means is-a and is what you want almost always.** `private` inheritance means \"implemented in terms of\" — the base's public members become private in the derived class and no outside code may convert `D*` to `B*`. `protected` inheritance is rare enough that you can safely learn it the day you meet it. If you write no mode at all, `class` defaults to `private` and `struct` defaults to `public`, which is a real source of confusion — **write the `public` explicitly**.",
      ],
      examples: [
        {
          id: "protected-access",
          title: "A protected operation over private state",
          lang: "cpp",
          code: `#include <iostream>

class Account {
public:
    explicit Account(double balance) : balance_(balance) {}
    virtual ~Account() = default;

    double balance() const { return balance_; }

protected:
    // Derived classes may move the balance. The outside world may not.
    void adjust(double delta) { balance_ += delta; }

private:
    double balance_;   // not even derived classes touch this directly
};

class SavingsAccount : public Account {
public:
    SavingsAccount(double balance, double rate)
        : Account(balance), rate_(rate) {}

    void applyInterest() { adjust(balance() * rate_); }   // protected: allowed

private:
    double rate_;
};

int main() {
    SavingsAccount s{1000.0, 0.05};
    s.applyInterest();
    std::cout << s.balance() << '\\n';

    // s.adjust(1e9);      // ERROR: 'adjust' is a protected member of 'Account'
    // s.balance_ = 1e9;   // ERROR: 'balance_' is a private member of 'Account'
}`,
          output: `1050`,
          explanation:
            "**`balance_` stays private and the invariant stays enforceable.** `SavingsAccount` cannot assign to it directly; it can only go through `adjust`, which `Account` controls. If `balance_` had been `protected` instead, every present and future subclass could set it to anything, and `Account` could no longer promise anything about its own state. Note also `SavingsAccount(balance, rate) : Account(balance)` — the base constructor is selected by name in the initialiser list.",
        },
      ],
      pitfalls: [
        {
          title: "Inheriting to reuse code is the wrong reason",
          body: "It is tempting to derive from a class because it already has members you want. That gives you the code, but it also gives you an is-a claim you may not mean, and every function taking a base reference will now accept your type. If you only want the implementation, hold the other class as a *member* and expose what you choose — composition, which lesson 7 makes the default recommendation. A class deriving from `std::vector` to get its storage is the canonical example of this mistake, and the missing virtual destructor in lesson 5 is the usual punishment.",
        },
      ],
    },
    {
      id: "is-a",
      heading: "The substitution rule",
      body: [
        "Public inheritance means **is-a**, and the test for it is stricter than the English sentence suggests.",
        "The rule — the Liskov substitution principle — is this: **anywhere a function accepts a `Base`, handing it a `Derived` must not break that function.** Not \"must compile\". Must still be *correct*. The derived class may do more, but it may not do less and may not violate anything the base promised.",
        "Working out whether that holds means looking at behaviour, not vocabulary. The famous case is a `Square` deriving from a `Rectangle`. Every square is a rectangle in geometry. But `Rectangle` promises that setting the width leaves the height alone, and no square can keep that promise, so `Square` is not substitutable for `Rectangle` — the is-a is false at the level that matters, which is the interface.",
        "The failure is quiet. The code compiles, the types line up, and a function that was correct for years starts producing wrong answers when a new subclass reaches it.",
      ],
      examples: [
        {
          id: "lsp",
          title: "A subclass that compiles and still breaks its caller",
          lang: "cpp",
          code: `#include <iostream>

class Rectangle {
public:
    virtual ~Rectangle() = default;
    virtual void setWidth(int w)  { width_  = w; }
    virtual void setHeight(int h) { height_ = h; }
    int area() const { return width_ * height_; }
protected:
    int width_{0};
    int height_{0};
};

// "A square is-a rectangle" is true in geometry and false for this interface.
class Square : public Rectangle {
public:
    void setWidth(int w)  override { width_ = height_ = w; }
    void setHeight(int h) override { width_ = height_ = h; }
};

// Written against Rectangle, and correct for every Rectangle. Or so it thought.
void resizeTo4x5(Rectangle& r) {
    r.setWidth(4);
    r.setHeight(5);
    std::cout << "  expected 20, got " << r.area() << '\\n';
}

int main() {
    Rectangle r;
    resizeTo4x5(r);

    Square s;
    resizeTo4x5(s);
}`,
          output: `  expected 20, got 20
  expected 20, got 25`,
          explanation:
            "**`resizeTo4x5` never mentions `Square` and was never changed, yet it now computes the wrong area.** `Square::setHeight` had to break `Rectangle`'s promise that width and height are independent, because that promise is false for squares. The type system cannot detect this — the signatures match perfectly. The fix is not a cleverer `Square`; it is to stop claiming the is-a, and give shapes an interface that only promises what all of them can deliver, which is what lesson 4 builds.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does a derived object look like in memory, and why is upcasting free?",
      answer:
        "A derived object contains a complete base subobject, laid out first, with the derived class's own members after it. Because the base subobject starts at the same address as the whole object, converting `Derived*` to `Base*` requires no runtime adjustment — the pointer already points at a valid `Base`. That is why the conversion is implicit and cannot fail. The reverse direction needs `static_cast` or `dynamic_cast`, because a `Base*` may point at a plain `Base` or at any derived type. The one exception is multiple inheritance, where the second and later bases sit at a non-zero offset and the compiler does adjust the pointer.",
    },
    {
      question: "Give the exact order of construction and destruction for a derived object.",
      answer:
        "Construction: the base class first — its members in declaration order, then its constructor body — then the derived class's members in declaration order, then the derived constructor's body. Destruction is the exact mirror: the derived destructor body, the derived members in reverse declaration order, the base destructor body, then the base's members. The order is fixed by the standard and ignores the order you write things in the initialiser list; a compiler will warn if the two disagree. It has to be this way so that a derived constructor body can safely use inherited members and a derived destructor body still can.",
    },
    {
      question: "When should a base class member be protected rather than private?",
      answer:
        "Protected *functions* are reasonable — they offer a controlled operation to subclasses without exposing the state behind it. Protected *data* is nearly as bad as public data: anyone can derive from the class and then read and write the member freely, so the class can no longer enforce any invariant over it. The default should be private data with protected accessors or operations where subclasses genuinely need them.",
    },
    {
      question: "What is the Liskov substitution principle, and how does the Square/Rectangle example violate it?",
      answer:
        "It says that anywhere a function accepts a base, passing a derived object must keep that function correct — not merely compiling, but still right. `Rectangle` promises that width and height are independent, so a function can set the width to 4 and the height to 5 and expect an area of 20. `Square` cannot honour that promise, because setting either dimension must change both. So a function written correctly against `Rectangle` silently produces a wrong answer when handed a `Square`. The type system cannot catch it because the signatures match. The lesson is that is-a is about behavioural promises, not English nouns.",
    },
    {
      question: "What is the difference between public and private inheritance?",
      answer:
        "Public inheritance models is-a: the base's public interface stays public, and outside code may convert a `Derived*` to a `Base*`. Private inheritance models \"implemented in terms of\": the base's public members become private in the derived class and outside code cannot perform the conversion, so no substitutability is claimed. Private inheritance is a form of composition and is almost always better written as a member instead — the exception being when you need to override a virtual function or want the empty base optimisation. Note that `class` defaults to private inheritance and `struct` to public, which is why you should always write the mode explicitly.",
    },
  ],
  takeaways: [
    "A derived object physically contains a base subobject, laid out first and sharing its address",
    "Upcasting `Derived*` to `Base*` is implicit and free because the address is already correct",
    "Construction runs base-first, members in declaration order; destruction is the exact mirror",
    "The base constructor is chosen by name in the derived class's member initialiser list",
    "`protected` grants access to derived classes only — prefer protected functions to protected data",
    "Always write the inheritance mode: `class` silently defaults to `private`, `struct` to `public`",
    "Public inheritance is a promise of substitutability, and the compiler cannot check that you kept it",
    "Wanting a class's code is not a reason to derive from it — hold it as a member instead",
  ],
  status: "available",
};
