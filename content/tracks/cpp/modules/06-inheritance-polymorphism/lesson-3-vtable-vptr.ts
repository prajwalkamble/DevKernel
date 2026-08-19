import type { Lesson } from "@/content/types";

export const vtableVptrLesson: Lesson = {
  id: "cpp-vtable-vptr",
  slug: "vtable-and-vptr",
  moduleSlug: "inheritance-polymorphism",
  title: "The vtable & vptr, Inspected in Real Memory",
  summary:
    "The machinery under `virtual`, taken apart on a real object. What a vtable actually contains, why ten virtual functions cost the same as one, and the fact that the vptr is rewritten as construction proceeds — which explains a rule you have to obey.",
  estimatedMinutes: 35,
  objectives: [
    "State the space cost of making a class polymorphic, and why it does not grow with the function count",
    "Read a real vtable dump and identify every slot",
    "Locate an object's vptr and call through its vtable by hand",
    "Explain why the vptr changes during construction and destruction",
    "Say what happens when a virtual function is called from a constructor",
  ],
  sections: [
    {
      id: "space-cost",
      heading: "What it costs an object",
      body: [
        "The moment a class gains its first virtual function, every object of that class grows by one pointer. That pointer is the **vptr**, and it points at a table of function addresses shared by the whole class — the **vtable**.",
        "**The vptr is per object. The vtable is per class.** That single sentence answers most questions about the cost.",
        "So the size penalty is one pointer per object, no matter how many virtual functions the class has. A class with ten virtual functions is exactly the same size as a class with one, because the object stores a pointer to the table, not the table itself.",
        "None of this is mandated by the standard, which only describes behaviour and never says the word *vtable*. But every mainstream C++ implementation does it this way, and on Linux and macOS the details are pinned down precisely by the **Itanium C++ ABI** — which is what makes the next section possible.",
      ],
      examples: [
        {
          id: "sizeof-growth",
          title: "One pointer, once",
          lang: "cpp",
          code: `#include <iostream>

struct Plain {
    int a;
    void f() const {}
};

struct OneVirtual {
    int a;
    virtual void f() const {}
    virtual ~OneVirtual() = default;
};

struct TenVirtuals {
    int a;
    virtual void f1() const {}
    virtual void f2() const {}
    virtual void f3() const {}
    virtual void f4() const {}
    virtual void f5() const {}
    virtual void f6() const {}
    virtual void f7() const {}
    virtual void f8() const {}
    virtual void f9() const {}
    virtual void f10() const {}
    virtual ~TenVirtuals() = default;
};

int main() {
    std::cout << "sizeof(Plain)       = " << sizeof(Plain) << '\\n';
    std::cout << "sizeof(OneVirtual)  = " << sizeof(OneVirtual) << '\\n';
    std::cout << "sizeof(TenVirtuals) = " << sizeof(TenVirtuals) << '\\n';
    std::cout << "sizeof(void*)       = " << sizeof(void*) << '\\n';

    OneVirtual x;
    x.a = 42;
    // The vptr is at offset 0; the int follows it.
    std::cout << "offset of a in OneVirtual = "
              << (reinterpret_cast<char*>(&x.a) - reinterpret_cast<char*>(&x))
              << '\\n';
}`,
          output: `sizeof(Plain)       = 4
sizeof(OneVirtual)  = 16
sizeof(TenVirtuals) = 16
sizeof(void*)       = 8
offset of a in OneVirtual = 8`,
          explanation:
            "**`OneVirtual` and `TenVirtuals` are both 16 bytes** — 8 for the vptr, 4 for the `int`, 4 of padding to keep the 8-byte alignment the pointer requires. Adding nine more virtual functions changed nothing, because they went into the shared table, not the object. Note the last line: `a` sits at offset 8, so **the vptr was placed first, at offset 0**. That is why lesson 2's assembly could load it with a bare `mov rax, [rdi]` with no offset. It is also why a polymorphic type is no longer trivially copyable, and why `memcpy`ing one is a bug rather than an optimisation.",
        },
      ],
      pitfalls: [
        {
          title: "One pointer per object is a real cost when there are millions of them",
          body: "A `struct Point { float x, y; };` is 8 bytes. Give it one virtual function and it becomes 24 — a threefold increase, before you have stored anything useful. In a `std::vector` of ten million points that is the difference between fitting in cache and not. This is the actual reason low-level and graphics code avoids virtual functions on small, numerous types, and it has nothing to do with the speed of the call itself.",
        },
      ],
    },
    {
      id: "layout",
      heading: "What is actually in the table",
      body: [
        "GCC will print the vtable it generated, with `-fdump-lang-class`. This is the real layout of the classes from the next example, not a diagram of one.",
        "Reading it top to bottom, each entry is 8 bytes:",
        "**Offset 0 — offset-to-top.** How far to move the pointer to reach the start of the complete object. It is `0` here and stays `0` for single inheritance; lesson 7 shows the case where it is not.",
        "**Offset 8 — the typeinfo pointer.** This is `dynamic_cast` and `typeid`, and it is where **RTTI** lives. Compiling with `-fno-rtti` removes this slot and both features with it.",
        "**Offset 16 onwards — the function pointers**, in declaration order.",
        "**The vptr does not point at the start of the table.** It points at offset 16 — the first function slot — so that a virtual call is a plain indexed load with no correction for the two header entries. GCC states this explicitly in the dump: `vptr=((& Circle::_ZTV6Circle) + 16)`.",
        "**Note the destructor appears twice.** The ABI emits two: the *complete object destructor*, which destroys members and bases, and the *deleting destructor*, which does that and then calls `operator delete`. Which one is used depends on whether the object is being destroyed or deleted — and lesson 5 is about what happens when the wrong one is chosen.",
        "Now compare `Shape`'s table with `Circle`'s. **The shape is identical and the slots line up.** `draw` is the first function slot in both. That is the invariant the whole mechanism rests on: because an override always occupies the same slot as the function it overrides, the compiler can hard-code the index at the call site without knowing the dynamic type.",
      ],
      examples: [
        {
          id: "vtable-dump",
          title: "GCC's own dump of two vtables",
          lang: "bash",
          code: `$ g++ -std=c++20 -fdump-lang-class=/dev/stdout -c shapes.cpp -o /dev/null

Vtable for Shape
Shape::_ZTV5Shape: 6 entries
0     (int (*)(...))0                      # offset-to-top
8     (int (*)(...))(& _ZTI5Shape)         # typeinfo -> RTTI
16    (int (*)(...))Shape::draw            # <-- vptr points HERE
24    (int (*)(...))Shape::name
32    (int (*)(...))Shape::~Shape          # complete object destructor
40    (int (*)(...))Shape::~Shape          # deleting destructor

Class Shape
   size=8 align=8
Shape (0x...) 0 nearly-empty
    vptr=((& Shape::_ZTV5Shape) + 16)

Vtable for Circle
Circle::_ZTV6Circle: 6 entries
0     (int (*)(...))0
8     (int (*)(...))(& _ZTI6Circle)
16    (int (*)(...))Circle::draw           # same slot, different function
24    (int (*)(...))Circle::name
32    (int (*)(...))Circle::~Circle
40    (int (*)(...))Circle::~Circle

Class Circle
   size=8 align=8
Circle (0x...) 0 nearly-empty
    vptr=((& Circle::_ZTV6Circle) + 16)
Shape (0x...) 0 nearly-empty`,
          explanation:
            "**`Circle`'s table has the same shape as `Shape`'s, with the overrides swapped into the matching slots.** `draw` is at vptr+0 in both, `name` at vptr+8 in both. This is what lets lesson 2's assembly say `jmp [rax+16]` and be correct for every possible dynamic type — the slot index is a property of the *base* class, fixed at compile time. It also explains the `16` in that assembly exactly: in that example the destructor was declared before `area`, so its two slots came first and pushed `area` to vptr+16.",
        },
      ],
    },
    {
      id: "walking-it",
      heading: "Walking the vtable by hand",
      body: [
        "Because the layout is fixed by the ABI, you can read the vptr out of an object and call through the table yourself. **This is not portable C++ and you must never ship it** — but doing it once makes the mechanism concrete in a way no diagram does.",
        "The vptr sits at offset 0, so `*reinterpret_cast<void**>(&obj)` is the table address. Index it, cast the entry back to a function pointer, and call it with the object as the implicit `this` argument.",
      ],
      examples: [
        {
          id: "manual-dispatch",
          title: "Dispatching manually, and getting the same answers",
          lang: "cpp",
          code: `// NOT portable C++. This inspects the Itanium ABI layout that Linux/macOS
// compilers use, to show that the vtable is an ordinary array in memory.
#include <iostream>

struct Shape {
    virtual void draw() const { std::cout << "  Shape::draw\\n"; }
    virtual void name() const { std::cout << "  Shape::name\\n"; }
    virtual ~Shape() = default;
};

struct Circle : Shape {
    void draw() const override { std::cout << "  Circle::draw\\n"; }
    void name() const override { std::cout << "  Circle::name\\n"; }
};

int main() {
    Shape  s;
    Circle c;

    // Read the hidden pointer stored at offset 0 of each object.
    auto vptr_of = [](const void* obj) {
        return *reinterpret_cast<void* const*>(obj);
    };

    std::cout << "Shape  object's vptr == Circle object's vptr ? "
              << (vptr_of(&s) == vptr_of(&c) ? "yes" : "no") << '\\n';

    Circle c2;
    std::cout << "two Circles share one vtable ?                "
              << (vptr_of(&c) == vptr_of(&c2) ? "yes" : "no") << '\\n';

    // Walk Circle's vtable and call slot 0 and slot 1 by hand.
    using Slot = void (*)(const Shape*);
    auto* vtable = *reinterpret_cast<Slot* const*>(&c);

    std::cout << "calling slot 0 through the vtable by hand:\\n";
    vtable[0](reinterpret_cast<const Shape*>(&c));
    std::cout << "calling slot 1 through the vtable by hand:\\n";
    vtable[1](reinterpret_cast<const Shape*>(&c));

    std::cout << "what the compiler generates for the same thing:\\n";
    const Shape* p = &c;
    p->draw();
    p->name();
}`,
          output: `Shape  object's vptr == Circle object's vptr ? no
two Circles share one vtable ?                yes
calling slot 0 through the vtable by hand:
  Circle::draw
calling slot 1 through the vtable by hand:
  Circle::name
what the compiler generates for the same thing:
  Circle::draw
  Circle::name`,
          explanation:
            "**The hand-written dispatch and the compiler's produce identical results, because they are doing identical work.** The two facts printed at the top are the ones to keep: objects of different classes carry different vptrs — that is how dispatch distinguishes them — and two objects of the *same* class share one vtable, which is why the cost is one pointer per object rather than a table per object. `this` is just the first argument, passed in `rdi`, which is why the manual call works at all.",
        },
      ],
    },
    {
      id: "vptr-during-construction",
      heading: "The vptr changes as the object is built",
      body: [
        "Lesson 1 established that construction runs base-first. Here is the consequence that catches people.",
        "**Each constructor sets the vptr to its own class's vtable before running its body.** So while `Base`'s constructor is executing, the object's vptr points at `Base`'s vtable — because at that moment the object genuinely *is* only a `Base`. The `Derived` part has not been initialised yet. When `Base`'s constructor returns, `Derived`'s constructor overwrites the vptr with `Derived`'s vtable and runs its body.",
        "Destruction unwinds the same way in reverse: `~Derived` runs, then the vptr is set back to `Base`'s vtable before `~Base` runs.",
        "**Therefore a virtual call inside a constructor or destructor does not dispatch to the derived override.** It resolves to the version belonging to the class currently being constructed. This is not a compiler bug and not undefined behaviour — it is deliberate, and it is the only safe choice, because the alternative would let `Base`'s constructor call a `Derived` function that reads uninitialised `Derived` members.",
        "**If the function is pure virtual, there is no version to call**, and the program dies at run time with a message about a pure virtual method call. Lesson 6 turns this into a rule you can follow.",
      ],
      examples: [
        {
          id: "vptr-shifting",
          title: "The same object answering the same question differently",
          lang: "cpp",
          code: `#include <iostream>

struct Base {
    Base() {
        std::cout << "  Base ctor  -> ";
        whoAmI();          // the object is a Base RIGHT NOW
    }
    virtual ~Base() {
        std::cout << "  Base dtor  -> ";
        whoAmI();          // and it is a Base again by now
    }
    virtual void whoAmI() const { std::cout << "I am a Base\\n"; }
};

struct Derived : Base {
    Derived() {
        std::cout << "  Deriv ctor -> ";
        whoAmI();
    }
    ~Derived() override {
        std::cout << "  Deriv dtor -> ";
        whoAmI();
    }
    void whoAmI() const override { std::cout << "I am a Derived\\n"; }
};

int main() {
    std::cout << "constructing a Derived:\\n";
    {
        Derived d;
        std::cout << "fully built  -> ";
        d.whoAmI();
        std::cout << "destroying:\\n";
    }
}`,
          output: `constructing a Derived:
  Base ctor  -> I am a Base
  Deriv ctor -> I am a Derived
fully built  -> I am a Derived
destroying:
  Deriv dtor -> I am a Derived
  Base dtor  -> I am a Base`,
          explanation:
            "**One object, five calls to the same virtual function, and the answer changes twice.** It is `Base` during `Base`'s constructor, `Derived` from then until `~Derived` finishes, and `Base` again by the time `~Base` runs. Nothing here is undefined — the vptr is simply being maintained, and each call correctly reflects how much of the object exists at that moment. The practical rule that falls out: **never call a virtual function from a constructor or destructor expecting the override to run**, because it will not.",
        },
      ],
      pitfalls: [
        {
          title: "Two-phase initialisation is the trap this creates",
          body: "The tempting design is a base constructor that calls a virtual `init()` so each subclass can set itself up. It does not work — the base's own `init` runs, and if it is pure virtual the program calls `std::terminate`. The fixes, in order of preference: do the work in the derived constructor where it belongs; pass what the base needs as a constructor argument; or use a factory function that constructs the object and then calls the virtual initialiser, once the object is complete and the vptr is final.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the memory cost of making a class polymorphic?",
      answer:
        "One pointer per object — the vptr — plus one vtable per class in the binary. The per-object cost does not grow with the number of virtual functions, because the object stores a pointer to the shared table rather than the table itself: a class with ten virtual functions is the same size as one with a single virtual function. On a 64-bit machine that is 8 bytes, though alignment can make the practical growth larger — a `struct { float x, y; }` goes from 8 bytes to 24. That matters when you have millions of small objects, which is the real reason performance-sensitive code avoids virtual functions on small types.",
    },
    {
      question: "What does a vtable contain, and where does the vptr point?",
      answer:
        "Under the Itanium ABI a vtable holds an offset-to-top value, a pointer to the class's typeinfo for RTTI, and then the virtual function addresses in declaration order — with the destructor occupying two slots, one complete-object and one deleting. The vptr points not at the start of the table but at the first function slot, past the two header entries, so a virtual call is a plain indexed load with no correction. None of this is in the standard, which never mentions vtables; it is how every mainstream implementation happens to work.",
    },
    {
      question: "Why can the compiler hard-code a slot index for a virtual call?",
      answer:
        "Because a derived class's vtable has the same layout as its base's, with overrides substituted into the matching slots. If `draw` is the first function slot in `Shape`'s table, it is the first function slot in every class derived from `Shape`. So the offset is a property of the static type, known at compile time, and the same instruction works for every possible dynamic type. That is why the call is a fixed indexed load and not a search or a lookup by name.",
    },
    {
      question: "What happens when you call a virtual function from a constructor?",
      answer:
        "It dispatches to the version belonging to the class currently under construction, not to the derived override. Each constructor sets the vptr to its own class's vtable before running its body, so during `Base`'s constructor the object is a `Base` as far as dispatch is concerned. This is deliberate and safe: the derived members do not exist yet, so calling a derived override would let it read uninitialised memory. Destructors behave the same way in reverse. If the function is pure virtual there is no implementation to call and the program terminates with a pure virtual method call error. The consequence is that virtual `init()` methods called from base constructors do not work; use a factory or the derived constructor instead.",
    },
    {
      question: "Is a polymorphic class trivially copyable, and why does it matter?",
      answer:
        "No. The vptr is part of the object representation but is not something you may copy freely between objects of different dynamic types, so a class with virtual functions is not trivially copyable. Practically, that means you cannot `memcpy` such an object, serialise it by dumping its bytes, or store it and expect the raw bytes to be meaningful in another process — the vptr is an address in *this* process's address space and would point at nothing valid elsewhere. Copy construction and assignment handle it correctly because the compiler knows to leave each object's vptr matching its own type.",
    },
  ],
  takeaways: [
    "The vptr is per object; the vtable is per class — that is the whole cost model",
    "Making a class polymorphic adds one pointer per object regardless of how many virtual functions it has",
    "The vptr is placed at offset 0, so a virtual call loads it with no offset",
    "A vtable holds offset-to-top, the typeinfo pointer for RTTI, then the functions in declaration order",
    "The vptr points at the first function slot, past the two header entries",
    "The destructor gets two slots: complete-object and deleting",
    "Overrides occupy the same slot as the function they override, which is why the index can be hard-coded",
    "Each constructor installs its own class's vptr before running its body, and destructors reverse it",
    "A virtual call from a constructor or destructor runs that class's version, never the derived override",
    "A polymorphic class is not trivially copyable — never `memcpy` or byte-serialise one",
  ],
  status: "available",
};
