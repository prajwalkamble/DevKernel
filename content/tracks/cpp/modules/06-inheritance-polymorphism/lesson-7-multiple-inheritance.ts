import type { Lesson } from "@/content/types";

export const multipleInheritanceLesson: Lesson = {
  id: "cpp-multiple-inheritance",
  slug: "multiple-inheritance-and-composition",
  moduleSlug: "inheritance-polymorphism",
  title: "Multiple Inheritance, the Diamond & Composition Instead",
  summary:
    "The feature other languages left out. Why a second base makes a pointer change value, what the diamond duplicates, what `virtual` inheritance costs to fix it — and the closing argument that composition should have been your first choice nearly every time.",
  estimatedMinutes: 40,
  objectives: [
    "Explain why casting to a second base adjusts the pointer",
    "Recognise the ambiguities multiple inheritance introduces and resolve them",
    "Describe the diamond problem and what duplicate base subobjects mean",
    "Use virtual inheritance, and say which class initialises the virtual base",
    "Distinguish the one safe use of multiple inheritance from the dangerous ones",
    "Choose composition over inheritance, and justify it concretely",
  ],
  sections: [
    {
      id: "two-bases",
      heading: "Two bases, two subobjects, one moving pointer",
      body: [
        "C++ allows a class to derive from several bases: `class Widget : public Serializable, public Drawable`. The object contains one subobject of each, laid out in declaration order.",
        "That layout has a consequence that catches everyone once. **The first base sits at offset 0, so `Widget*` to `Serializable*` is free, exactly as in lesson 1. The second base does not.** It sits after the first, so converting a `Widget*` to a `Drawable*` requires *adding* that offset — the pointer changes value.",
        "So the same object has two different valid addresses depending on which base you view it through. `static_cast` handles this silently and correctly in both directions, and `dynamic_cast` handles it for the cases `static_cast` cannot. But it explains several things that would otherwise be baffling: why comparing two pointers to the same object as `void*` can say they differ, why `reinterpret_cast` between base pointers is a serious bug rather than a shortcut, and why a polymorphic object with multiple bases carries **more than one vptr**.",
      ],
      examples: [
        {
          id: "pointer-adjustment",
          title: "The same object at two addresses",
          lang: "cpp",
          code: `#include <cstdint>
#include <iostream>

struct Serializable {
    virtual ~Serializable() = default;
    virtual void save() const = 0;
    int serialVersion{1};
};

struct Drawable {
    virtual ~Drawable() = default;
    virtual void draw() const = 0;
    int zOrder{0};
};

// Two bases. The object contains one subobject of each, laid out in order.
struct Widget : Serializable, Drawable {
    void save() const override { std::cout << "  Widget::save\\n"; }
    void draw() const override { std::cout << "  Widget::draw\\n"; }
    int id{7};
};

int main() {
    Widget w;

    auto addr = [](const void* p) { return reinterpret_cast<std::uintptr_t>(p); };

    const Serializable* s = &w;   // first base: offset 0
    const Drawable*     d = &w;   // second base: the pointer MOVES

    std::cout << "sizeof(Serializable) = " << sizeof(Serializable) << '\\n';
    std::cout << "sizeof(Drawable)     = " << sizeof(Drawable) << '\\n';
    std::cout << "sizeof(Widget)       = " << sizeof(Widget) << '\\n';

    std::cout << "&w  as Serializable* offset = " << addr(s) - addr(&w) << '\\n';
    std::cout << "&w  as Drawable*     offset = " << addr(d) - addr(&w) << '\\n';

    // Same object, two different addresses, and both are correct.
    std::cout << "s == d as void*? "
              << (static_cast<const void*>(s) == static_cast<const void*>(d))
              << '\\n';

    // Casting back recovers the original address.
    const Widget* back = static_cast<const Widget*>(d);
    std::cout << "recovered == &w? " << (back == &w) << '\\n';

    s->save();
    d->draw();
}`,
          output: `sizeof(Serializable) = 16
sizeof(Drawable)     = 16
sizeof(Widget)       = 32
&w  as Serializable* offset = 0
&w  as Drawable*     offset = 16
s == d as void*? 0
recovered == &w? 1
  Widget::save
  Widget::draw`,
          explanation:
            "**The `Drawable*` is 16 bytes past the `Widget*`, and both point at the same object.** Comparing them as `void*` reports them unequal, which is correct and surprising — comparing them as `Widget*` after casting back reports equal, which is the comparison you actually meant. `Widget` is 32 bytes because it carries *two* vptrs, one for each polymorphic base. This offset is also what lesson 3's `offset-to-top` vtable slot is for: it tells the runtime how far back to move to find the start of the complete object.",
        },
      ],
    },
    {
      id: "the-diamond",
      heading: "The diamond",
      body: [
        "Now let both bases derive from a common base. `Reader` and `Writer` each derive from `Device`; `ReadWriter` derives from both. The inheritance graph is a diamond, and the question is how many `Device` subobjects a `ReadWriter` contains.",
        "**With ordinary inheritance, the answer is two.** Each branch brings its own complete copy. `Device`'s constructor runs twice, its members exist twice, and there is no single `Device` inside a `ReadWriter`.",
        "That produces two distinct failures, both at compile time, which is the one mercy here.",
        "**Member access is ambiguous.** `rw.id_` does not compile, because there are two `id_`s and the compiler will not choose. You must say `rw.Reader::id_` or `rw.Writer::id_`.",
        "**The upcast is ambiguous.** `Device* d = &rw;` does not compile either — there are two `Device` subobjects and no basis for picking one. So a `ReadWriter` cannot be passed to a function taking a `Device*` without saying which half you mean.",
        "Sometimes two copies are genuinely what you want. Usually the state was meant to be shared, and the diamond is a design error announcing itself.",
      ],
      examples: [
        {
          id: "diamond-duplicate",
          title: "Two Devices in one object",
          lang: "cpp",
          code: `#include <iostream>

struct Device {
    explicit Device(int id) : id_(id) {
        std::cout << "  Device(" << id << ")\\n";
    }
    virtual ~Device() = default;
    int id_;
};

// Non-virtual inheritance: each branch gets its OWN Device subobject.
struct Reader : Device {
    Reader() : Device(1) {}
};

struct Writer : Device {
    Writer() : Device(2) {}
};

struct ReadWriter : Reader, Writer {};

int main() {
    ReadWriter rw;

    std::cout << "sizeof(Device)     = " << sizeof(Device) << '\\n';
    std::cout << "sizeof(ReadWriter) = " << sizeof(ReadWriter) << '\\n';

    // std::cout << rw.id_;      // ERROR: request for member 'id_' is ambiguous
    std::cout << "Reader's id = " << rw.Reader::id_ << '\\n';
    std::cout << "Writer's id = " << rw.Writer::id_ << '\\n';

    // Two distinct Device subobjects inside one object.
    std::cout << "distinct Devices? "
              << (static_cast<Device*>(static_cast<Reader*>(&rw))
                  != static_cast<Device*>(static_cast<Writer*>(&rw)))
              << '\\n';

    // Device* d = &rw;          // ERROR: 'Device' is an ambiguous base
}`,
          output: `  Device(1)
  Device(2)
sizeof(Device)     = 16
sizeof(ReadWriter) = 32
Reader's id = 1
Writer's id = 2
distinct Devices? 1

# with the commented-out lines restored:
error: request for member 'id_' is ambiguous
error: 'Device' is an ambiguous base of 'ReadWriter'`,
          explanation:
            "**`Device`'s constructor ran twice and the object holds two independent ids.** If `Device` had held a file handle or a connection, this `ReadWriter` would have opened two of them. The ambiguity errors are the compiler refusing to guess, and qualifying with `Reader::` or `Writer::` only papers over the question of which one is *real*. When the answer is \"they should be the same one\", you need the next section.",
        },
      ],
    },
    {
      id: "virtual-inheritance",
      heading: "Virtual inheritance",
      body: [
        "Writing `struct Reader : virtual Device` says: **however many paths reach `Device`, there is only ever one `Device` subobject in the complete object.** Both branches share it, the ambiguities vanish, and `Device* d = &rw;` compiles.",
        "The keyword goes on the *intermediate* classes — `Reader` and `Writer` — not on `ReadWriter`. That means **the decision belongs to the classes in the middle, which must anticipate being combined**, and it cannot be made later by whoever writes the derived class. That is the first practical objection to the mechanism.",
        "**The second is the initialisation rule, which surprises everyone.** A virtual base is initialised by the **most derived class**, directly — not by the intermediate classes. So `ReadWriter`'s constructor must name `Device` in its initialiser list, and `Reader`'s and `Writer`'s attempts to initialise `Device` are *ignored entirely* when they are part of a `ReadWriter`. The same `Reader() : Device(1)` runs and matters when a `Reader` is constructed on its own, and is silently skipped when it is a sub-part of something larger. A class must effectively know whether it is the most derived one.",
        "**And the third is cost.** The shared subobject can no longer live at a fixed offset, since that offset differs depending on the complete type. Implementations add an indirection — typically a virtual base offset stored in the vtable — so access to a virtual base's members goes through a lookup rather than a constant offset.",
        "Virtual inheritance is the right tool for exactly one common thing: **interfaces**. An abstract class with no data has nothing to duplicate, so inheriting several of them costs nothing and raises none of these questions. Reach for `virtual` inheritance when a diamond over a *stateful* base is genuinely unavoidable, and treat that as a signal to re-examine the design first.",
      ],
      examples: [
        {
          id: "virtual-base",
          title: "One shared Device, initialised by the most derived class",
          lang: "cpp",
          code: `#include <iostream>

struct Device {
    explicit Device(int id) : id_(id) {
        std::cout << "  Device(" << id << ")\\n";
    }
    virtual ~Device() = default;
    int id_;
};

// 'virtual' inheritance: Reader and Writer SHARE one Device subobject.
struct Reader : virtual Device {
    Reader() : Device(1) { std::cout << "  Reader\\n"; }
};

struct Writer : virtual Device {
    Writer() : Device(2) { std::cout << "  Writer\\n"; }
};

// The MOST DERIVED class initialises the virtual base. The Device(1) and
// Device(2) in Reader and Writer are IGNORED here.
struct ReadWriter : Reader, Writer {
    ReadWriter() : Device(99), Reader(), Writer() {
        std::cout << "  ReadWriter\\n";
    }
};

int main() {
    std::cout << "constructing:\\n";
    ReadWriter rw;

    std::cout << "sizeof(Device)     = " << sizeof(Device) << '\\n';
    std::cout << "sizeof(ReadWriter) = " << sizeof(ReadWriter) << '\\n';

    std::cout << "rw.id_ = " << rw.id_ << '\\n';        // unambiguous now

    Device* d = &rw;                                    // and this compiles
    std::cout << "via Device* : " << d->id_ << '\\n';

    std::cout << "one shared Device? "
              << (static_cast<Device*>(static_cast<Reader*>(&rw))
                  == static_cast<Device*>(static_cast<Writer*>(&rw)))
              << '\\n';
}`,
          output: `constructing:
  Device(99)
  Reader
  Writer
  ReadWriter
sizeof(Device)     = 16
sizeof(ReadWriter) = 32
rw.id_ = 99
via Device* : 99
one shared Device? 1`,
          explanation:
            "**`Device(99)` ran once, and `Device(1)` and `Device(2)` never ran at all** — the intermediate classes' initialisers for the virtual base were discarded, exactly as the rule says. Note the ordering too: the virtual base is constructed *first*, before `Reader`, because it must exist before anything that shares it. `rw.id_` and the upcast to `Device*` now both compile. This works, and it required `Reader` and `Writer` to have been written with `virtual` from the start.",
        },
      ],
      pitfalls: [
        {
          title: "`std::iostream` is the diamond in the standard library",
          body: "`std::istream` and `std::ostream` both inherit virtually from `std::ios_base`, and `std::iostream` inherits from both — sharing one stream state, one buffer, one set of format flags. It is the canonical example of virtual inheritance being genuinely the right answer, and it is also more or less the only one most programmers will meet. If your design has reproduced this shape, check that you have the same justification: a single piece of state that two capabilities must genuinely share.",
        },
      ],
    },
    {
      id: "composition",
      heading: "Composition instead",
      body: [
        "Multiple inheritance has one use that is uncontroversial and one that causes most of the trouble.",
        "**Implementing several interfaces is fine.** Abstract classes with no data have nothing to duplicate and no state to share. `class Widget : public Serializable, public Drawable` is a clean design, and it is what Java and C# permit while forbidding the rest.",
        "**Inheriting from several classes with state is where the problems live** — the diamond, the ambiguities, the initialisation rules, the pointer adjustments. And it is almost always motivated by wanting the implementation rather than the is-a relationship, which lesson 1 already identified as the wrong reason to inherit.",
        "**Composition is the alternative, and it should be the default.** Hold the other class as a member, and expose exactly the operations you mean to. It costs a line of forwarding per operation, and it buys a great deal.",
        "**You choose the interface.** Inheriting publicly exports every public member of the base whether it makes sense for your type or not.",
        "**You can hold several without any of this.** Two members of the same type is unremarkable; two base subobjects of the same type is a diamond.",
        "**You can change your mind.** Swapping a member's type is a local edit; changing a base class ripples through every conversion and every override.",
        "**And there is no coupling to the base's virtuals**, no destructor rule to remember, no slicing risk.",
        "The guideline in the C++ Core Guidelines is straightforward: **use inheritance when you need runtime substitutability through a base interface; use composition for everything else.**",
      ],
      examples: [
        {
          id: "composition-vs-inheritance",
          title: "The same reuse, done both ways",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

// ---- The engine we want to reuse. Note: no virtual functions at all. ----
class RingBuffer {
public:
    explicit RingBuffer(std::size_t cap) : cap_(cap) {}
    void push(std::string v) {
        if (data_.size() == cap_) data_.erase(data_.begin());
        data_.push_back(std::move(v));
    }
    std::size_t size() const { return data_.size(); }
    const std::string& at(std::size_t i) const { return data_[i]; }
private:
    std::size_t              cap_;
    std::vector<std::string> data_;
};

// ---- WRONG: inheritance to get the implementation. ----
// Every RingBuffer member becomes part of EventLog's public interface,
// including at(), which lets callers reach past the abstraction.
class BadEventLog : public RingBuffer {
public:
    BadEventLog() : RingBuffer(3) {}
};

// ---- RIGHT: composition. Hold it, expose exactly what you mean to. ----
class EventLog {
public:
    void record(const std::string& event) { buf_.push("[log] " + event); }

    std::size_t count() const { return buf_.size(); }

    void dump() const {
        for (std::size_t i = 0; i < buf_.size(); ++i)
            std::cout << "  " << buf_.at(i) << '\\n';
    }

private:
    RingBuffer buf_{3};      // an implementation detail, and it stays one
};

int main() {
    EventLog log;
    log.record("boot");
    log.record("connect");
    log.record("auth");
    log.record("query");     // evicts "boot"

    std::cout << "count = " << log.count() << '\\n';
    log.dump();

    // log.push("raw");      // ERROR: EventLog has no push -- good
    BadEventLog bad;
    bad.push("raw, unprefixed, straight past record()");   // compiles. bad.
    std::cout << "bad log leaked its engine: " << bad.at(0) << '\\n';
}`,
          output: `count = 3
  [log] connect
  [log] auth
  [log] query
bad log leaked its engine: raw, unprefixed, straight past record()`,
          explanation:
            "**`BadEventLog` cannot enforce its own `[log]` prefix**, because inheriting publicly handed every caller a `push` that bypasses `record`. `EventLog` reuses exactly the same engine and keeps the invariant, because `buf_` is private and the only way in is the one method it chose to expose. There is a second, quieter problem with `BadEventLog`: `RingBuffer` has no virtual destructor, so anyone who ever holds one by `RingBuffer*` and deletes it triggers lesson 5's undefined behaviour. Composition never raises the question.",
        },
      ],
      pitfalls: [
        {
          title: "The other alternatives to a hierarchy, once you know they exist",
          body: "Inheritance is not the only way to get polymorphism in modern C++. **`std::variant` plus `std::visit`** gives a closed set of types with no allocation, no vtable and no virtual destructor question — better whenever the set of types is fixed and known. **Templates** give compile-time polymorphism with no runtime cost at all, which module 7 covers. **`std::function`** stores any callable behind one signature, when all you needed was a customisation point rather than a type hierarchy. Reach for a virtual hierarchy when the set of types is genuinely open and must be extensible at run time — a plugin interface, a set of drivers, something loaded from configuration. That is what it is good at.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does casting to a second base class change the value of the pointer?",
      answer:
        "Because a multiply-derived object contains one subobject per base, laid out in declaration order. The first base starts at offset 0, so that conversion is free; the second sits after it, so converting to it must add the offset. The same object therefore has two different valid addresses depending on which base you view it through — comparing them as `void*` reports them unequal. `static_cast` performs the adjustment correctly in both directions, which is exactly why `reinterpret_cast` between base pointers is a bug rather than a shortcut. It also means such an object carries more than one vptr, and it is what the vtable's offset-to-top slot exists for.",
    },
    {
      question: "What is the diamond problem?",
      answer:
        "When two classes derive from a common base and a fourth derives from both, the most derived object contains two complete copies of that common base. The base constructor runs twice and its members exist twice, so there is no single shared state. Both consequences are compile errors: naming an inherited member is ambiguous and must be qualified with `Reader::` or `Writer::`, and upcasting to the common base is ambiguous and simply will not compile. Occasionally two copies are what you want; usually the state was meant to be shared, and the diamond is the design telling you something is wrong.",
    },
    {
      question: "How does virtual inheritance fix the diamond, and what does it cost?",
      answer:
        "Declaring the intermediate classes as `: virtual Base` guarantees exactly one shared base subobject however many paths reach it, so the ambiguities disappear and the upcast compiles. Three costs. The keyword goes on the intermediate classes, so they must anticipate being combined — the decision cannot be made later. The virtual base is initialised by the *most derived* class directly, and the intermediate classes' initialisers for it are silently ignored, so a class effectively has to know whether it is the most derived one. And the shared subobject can no longer sit at a fixed offset, so implementations add an indirection through a virtual base offset in the vtable, making member access more expensive.",
    },
    {
      question: "Which class initialises a virtual base, and why does that surprise people?",
      answer:
        "The most derived class, directly in its own member initialiser list. The intermediate classes' attempts to initialise the virtual base are ignored when they are part of a larger object — so `Reader() : Device(1)` matters when a `Reader` is constructed alone and is skipped entirely when the `Reader` is part of a `ReadWriter`. The rule has to exist because a shared subobject can only be constructed once and only the most derived class knows what the right arguments are. It surprises people because a constructor that plainly appears to run does not, and because it means intermediate classes cannot rely on their own initialisation of the shared base.",
    },
    {
      question: "When is multiple inheritance acceptable?",
      answer:
        "Implementing several interfaces — abstract classes with no data members. There is no state to duplicate, so the diamond, the initialisation rules and the sharing questions never arise, and it is exactly the subset Java and C# allow. Inheriting from multiple classes that carry state is where the problems live, and it is nearly always motivated by wanting the implementation rather than substitutability, which composition serves better. The standard library's `std::iostream` is the well-known counterexample where virtual inheritance over stateful bases is genuinely right, because `istream` and `ostream` must share one stream state.",
    },
    {
      question: "Why prefer composition to inheritance?",
      answer:
        "Public inheritance exports the base's entire public interface whether it suits your type or not, so a class deriving from a buffer to reuse it hands callers every operation that bypasses its own invariants. Composition lets you expose exactly the operations you mean, at the cost of a line of forwarding each. It also lets you hold several objects of the same type without a diamond, change the member's type as a local edit rather than a ripple through every conversion and override, and avoid the virtual destructor question and slicing entirely. The guideline is to inherit when you need runtime substitutability through a base interface, and compose for everything else.",
    },
    {
      question: "What are the alternatives to a virtual hierarchy in modern C++?",
      answer:
        "`std::variant` with `std::visit` when the set of types is closed and known — no allocation, no vtable, no destructor rule, and the compiler checks you handled every case. Templates for compile-time polymorphism with no runtime cost, where the type is known at the call site. `std::function` when what you actually needed was a single customisation point rather than a family of types. A virtual hierarchy earns its keep when the set of types is genuinely open and extensible at run time — plugins, drivers, anything chosen by configuration — which is what dynamic dispatch is uniquely good at.",
    },
  ],
  takeaways: [
    "A multiply-derived object holds one subobject per base, in declaration order",
    "The second and later bases sit at non-zero offsets, so the pointer value changes on conversion",
    "The same object legitimately has different addresses viewed through different bases",
    "A polymorphic class with two polymorphic bases carries two vptrs",
    "An ordinary diamond gives two copies of the shared base — member access and upcasts become ambiguous",
    "`virtual` inheritance gives exactly one shared subobject, and goes on the intermediate classes",
    "A virtual base is initialised by the most derived class; intermediate initialisers are ignored",
    "The virtual base is constructed first, before the classes that share it",
    "`std::iostream` is the standard library's diamond, and roughly the only one most people meet",
    "Inheriting multiple *interfaces* is clean; inheriting multiple *stateful* classes is where trouble starts",
    "Composition exposes what you choose, avoids the destructor and slicing questions, and stays local to change",
    "Inherit for runtime substitutability through a base interface; compose for everything else",
    "`std::variant`, templates and `std::function` cover cases a hierarchy is the wrong shape for",
  ],
  status: "available",
};
