import type { Lesson } from "@/content/types";

export const virtualDestructorsSlicingLesson: Lesson = {
  id: "cpp-virtual-destructors-slicing",
  slug: "virtual-destructors-and-slicing",
  moduleSlug: "inheritance-polymorphism",
  title: "Virtual Destructors & Object Slicing",
  summary:
    "The two ways value semantics quietly break polymorphism. One missing keyword turns `delete` into undefined behaviour and leaks 32KB in the example below; one missing `&` copies half an object and loses the rest. Both compile without complaint.",
  estimatedMinutes: 35,
  objectives: [
    "Explain what `delete` through a base pointer does without a virtual destructor",
    "Read the sanitizer's `new-delete-type-mismatch` report and say what it means",
    "State the rule for when a base class needs a virtual destructor",
    "Explain why `shared_ptr` escapes the problem and `unique_ptr` does not",
    "Recognise object slicing in parameters, assignment and containers, and fix each",
  ],
  sections: [
    {
      id: "the-bug",
      heading: "Deleting through a base pointer",
      body: [
        "Lesson 3 showed the destructor occupying two vtable slots. Here is why that matters.",
        "When you write `delete p` where `p` is a `Base*`, the compiler must decide which destructor to call. **If the destructor is not virtual, that decision is made statically from the pointer's type**, exactly like any other non-virtual call — so it calls `~Base` and nothing else.",
        "The derived destructor never runs. Everything the derived class owned is leaked. And because the compiler also passes the *wrong size* to `operator delete`, the deallocation itself is wrong.",
        "**The standard calls this undefined behaviour**, not merely a leak. In practice on a typical implementation you get the leak, and with a sized deallocation you get a heap corrupted quietly enough that the damage may surface much later, somewhere unrelated.",
      ],
      examples: [
        {
          id: "missing-virtual-dtor",
          title: "One missing keyword, 32,000 bytes",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

// BROKEN: a polymorphic base with a NON-virtual destructor.
class Task {
public:
    virtual void run() const { std::cout << "  generic task\\n"; }
    ~Task() { std::cout << "  ~Task\\n"; }        // NOT virtual
};

class ReportTask : public Task {
public:
    ReportTask() : rows_(1000, "row") {}
    void run() const override {
        std::cout << "  report over " << rows_.size() << " rows\\n";
    }
    ~ReportTask() { std::cout << "  ~ReportTask\\n"; }
private:
    std::vector<std::string> rows_;   // this is what leaks
};

int main() {
    Task* t = new ReportTask;
    t->run();          // dispatches correctly -- run() IS virtual
    delete t;          // undefined behaviour: ~ReportTask never runs
    std::cout << "still here\\n";
}`,
          output: `$ g++ -std=c++20 -Wall -Wextra -o bad bad.cpp
bad.cpp:24:5: warning: deleting object of polymorphic class type 'Task' which
has non-virtual destructor might cause undefined behavior
   [-Wdelete-non-virtual-dtor]
   24 |     delete t;
      |     ^~~~~~~~

$ ./bad
  report over 1000 rows
  ~Task                          # ~ReportTask never ran
still here

$ g++ -fsanitize=address ... && ./bad
ERROR: AddressSanitizer: new-delete-type-mismatch on 0x503000000040
  object passed to delete has wrong type:
  size of the allocated type:   32 bytes;
  size of the deallocated type: 8 bytes.

$ ASAN_OPTIONS=new_delete_type_mismatch=0 ./bad
ERROR: LeakSanitizer: detected memory leaks
Direct leak of 32000 byte(s) in 1 object(s)
SUMMARY: AddressSanitizer: 32000 byte(s) leaked in 1 allocation(s).`,
          explanation:
            "**`run()` dispatched perfectly and the destructor did not** — the class is polymorphic in every respect except the one that runs at the end. Three separate tools reported it: GCC's `-Wdelete-non-virtual-dtor` at compile time, AddressSanitizer catching that 32 bytes were allocated and 8 deallocated, and LeakSanitizer finding the 32,000 bytes of `std::vector<std::string>` that `~ReportTask` would have freed. **Turn that warning on and treat it as an error** — it catches this before the program ever runs.",
        },
      ],
    },
    {
      id: "the-rule",
      heading: "The rule, and the two correct answers",
      body: [
        "The guideline is short: **a base class destructor should be either public and virtual, or protected and non-virtual.**",
        "**Public and virtual** is what you want whenever anyone might delete through a base pointer — which is any interface handed out as `unique_ptr<Base>`. Adding `virtual ~Base() = default;` is the entire fix.",
        "**Protected and non-virtual** is for a base that is never deleted polymorphically. Making the destructor protected means outside code *cannot* write `delete basePtr` — it becomes a compile error rather than undefined behaviour — while derived classes can still destroy their base subobject normally. This is the right answer for mixins and for policy bases, and it avoids paying for a vtable entry you do not need.",
        "The cost of getting it wrong in the other direction is small but real: **adding a virtual destructor to a class that had no virtual functions makes it polymorphic**, which adds a vptr, adds 8 bytes per object, and stops the type being trivially copyable. That is why the rule is not simply \"always add one\".",
        "Note also that **`= default` is the right body**. Writing `virtual ~Base() {}` works but suppresses the implicitly generated move operations, which is the trap from module 4 and module 5 — declaring any destructor at all costs you the moves unless you default them back.",
      ],
      examples: [
        {
          id: "fixed",
          title: "The same program with the keyword added",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

// FIXED: one keyword.
class Task {
public:
    virtual void run() const { std::cout << "  generic task\\n"; }
    virtual ~Task() { std::cout << "  ~Task\\n"; }
};

class ReportTask : public Task {
public:
    ReportTask() : rows_(1000, "row") {}
    void run() const override {
        std::cout << "  report over " << rows_.size() << " rows\\n";
    }
    ~ReportTask() override { std::cout << "  ~ReportTask\\n"; }
private:
    std::vector<std::string> rows_;
};

int main() {
    Task* t = new ReportTask;
    t->run();
    delete t;          // now runs ~ReportTask, then ~Task
    std::cout << "still here\\n";
}`,
          output: `  report over 1000 rows
  ~ReportTask
  ~Task
still here

$ g++ -fsanitize=address ... && ./good
[no errors, no leaks]`,
          explanation:
            "**Both destructors now run, in the right order** — derived first, then base, exactly as lesson 1 described. `delete` on a `Task*` now dispatches through the vtable to `~ReportTask`, which destroys the vector and then chains to `~Task` automatically. Note `~ReportTask() override` — `override` is legal and useful on a destructor, and it will fail to compile if the base destructor is not virtual, which turns this whole bug into a compile error at the *derived* class too.",
        },
      ],
      pitfalls: [
        {
          title: "The compiler warning does not fire through `unique_ptr`",
          body: "`-Wdelete-non-virtual-dtor` triggers on a literal `delete p`. When the `delete` happens inside `std::unique_ptr`'s destructor — a template in a header — GCC does not warn, and the example in the next section compiles completely silently at `-Wall -Wextra` while still leaking. Since holding polymorphic objects by `unique_ptr<Base>` is the *recommended* style, the warning misses the most common form of the bug. Do not rely on it alone; rely on the rule.",
        },
      ],
    },
    {
      id: "smart-pointers",
      heading: "Why `shared_ptr` gets away with it",
      body: [
        "There is one genuine asymmetry between the two smart pointers, and it is worth understanding rather than memorising.",
        "**`std::unique_ptr<Base>` needs the virtual destructor.** Its deleter is part of its type — `unique_ptr<Base, default_delete<Base>>` — and `default_delete<Base>` does exactly `delete ptr` on a `Base*`. Nothing about the original `Derived` survives the conversion.",
        "**`std::shared_ptr<Base>` does not.** It type-erases its deleter into the control block, and the deleter is captured *when the object is created*, while the real type is still known. So `make_shared<Derived>()` stores a deleter that calls `~Derived`, and it keeps working after the pointer is converted to `shared_ptr<Base>`.",
        "**Do not use this as a licence to omit the destructor.** It makes the correctness of `delete` depend on which smart pointer a caller happened to choose, and a raw `delete` or a `unique_ptr` anywhere in the codebase reintroduces the bug. It is worth knowing because it explains behaviour you may otherwise find baffling when debugging.",
      ],
      examples: [
        {
          id: "smart-pointer-difference",
          title: "Same broken class, two different outcomes",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>

// Still no virtual destructor -- deliberately.
struct Base {
    ~Base() { std::cout << "  ~Base\\n"; }
};

struct Derived : Base {
    ~Derived() { std::cout << "  ~Derived\\n"; }
};

int main() {
    std::cout << "unique_ptr<Base>:\\n";
    {
        std::unique_ptr<Base> p = std::make_unique<Derived>();
    }   // calls delete on a Base* -- ~Derived is SKIPPED

    std::cout << "shared_ptr<Base>:\\n";
    {
        std::shared_ptr<Base> p = std::make_shared<Derived>();
    }   // ~Derived RUNS: the deleter was captured when the Derived was created

    std::cout << "shared_ptr<Base> from a shared_ptr<Derived>:\\n";
    {
        std::shared_ptr<Derived> d = std::make_shared<Derived>();
        std::shared_ptr<Base>    b = d;    // still remembers it is a Derived
    }
}`,
          output: `unique_ptr<Base>:
  ~Base
shared_ptr<Base>:
  ~Derived
  ~Base
shared_ptr<Base> from a shared_ptr<Derived>:
  ~Derived
  ~Base`,
          explanation:
            "**Identical classes, identical intent, and only the `unique_ptr` case is broken.** The whole program compiles clean at `-Wall -Wextra` — the warning from the previous section never appears, because there is no literal `delete` in the source. This is the single strongest argument for following the rule mechanically rather than reasoning case by case: whether this code leaks depends on a caller's choice of smart pointer, made in a different file.",
        },
      ],
    },
    {
      id: "slicing",
      heading: "Object slicing",
      body: [
        "The second failure of value semantics is the mirror image of the first. Where a missing virtual destructor loses the derived part at the *end* of an object's life, slicing loses it at the *start* of a copy.",
        "**A `Base` variable holds exactly `sizeof(Base)` bytes.** Copy a `Derived` into one and there is nowhere for the extra members to go, so the base copy constructor copies the base subobject and the rest is discarded. The result is a genuine, valid `Base` — with a `Base` vptr — that has silently lost its identity.",
        "It compiles without a warning because it is not, in itself, illegal: it is an ordinary base-from-derived copy, which is sometimes exactly what you want.",
        "It arrives in three disguises.",
        "**Passing by value** — `void f(Base b)` called with a `Derived`. The most common form, and a missing `&` is all it takes.",
        "**Assignment to a base object** — `Base b; b = derived;`.",
        "**Containers of values** — `std::vector<Base>` slices on every insertion, and this one is particularly nasty because the collection looks polymorphic and is not.",
      ],
      examples: [
        {
          id: "slicing-demo",
          title: "Four slices and two fixes",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

class Employee {
public:
    explicit Employee(std::string name) : name_(std::move(name)) {}
    virtual ~Employee() = default;
    virtual double pay() const { return 1000.0; }
    const std::string& name() const { return name_; }
private:
    std::string name_;
};

class Manager : public Employee {
public:
    Manager(std::string name, double bonus)
        : Employee(std::move(name)), bonus_(bonus) {}
    double pay() const override { return Employee::pay() + bonus_; }
private:
    double bonus_;
};

// THE BUG: taking the parameter by value slices off everything derived.
void printPayByValue(Employee e) {
    std::cout << "  by value:     " << e.name() << " earns " << e.pay() << '\\n';
}

// THE FIX: a reference refers to the whole object.
void printPayByRef(const Employee& e) {
    std::cout << "  by reference: " << e.name() << " earns " << e.pay() << '\\n';
}

int main() {
    Manager m{"Ada", 500.0};

    printPayByValue(m);      // sliced
    printPayByRef(m);        // intact

    std::cout << "assignment:\\n";
    Employee e{"placeholder"};
    e = m;                   // sliced: only the Employee part is copied
    std::cout << "  after e = m:  " << e.name() << " earns " << e.pay() << '\\n';

    std::cout << "container of values:\\n";
    std::vector<Employee> staff;
    staff.push_back(m);      // sliced on the way in
    std::cout << "  in vector:    " << staff[0].name()
              << " earns " << staff[0].pay() << '\\n';

    std::cout << "container of pointers:\\n";
    std::vector<const Employee*> staffPtrs{&m};
    std::cout << "  in vector:    " << staffPtrs[0]->name()
              << " earns " << staffPtrs[0]->pay() << '\\n';
}`,
          output: `  by value:     Ada earns 1000
  by reference: Ada earns 1500
assignment:
  after e = m:  Ada earns 1000
container of values:
  in vector:    Ada earns 1000
container of pointers:
  in vector:    Ada earns 1500`,
          explanation:
            "**Every `1000` is a bug and every `1500` is correct**, and the only difference is whether the object was reached through a value or an indirection. The name survived every slice, which is what makes this so hard to spot in review: the object looks right, prints a sensible name, and quietly answers the polymorphic question wrong. Note that the sliced `Employee` is not corrupt — it is a perfectly valid `Employee` that has simply forgotten it was ever a `Manager`.",
        },
      ],
      pitfalls: [
        {
          title: "The fixes, in the order you should reach for them",
          body: "**Take parameters by `const Base&`** — this alone removes most slicing. **Store `std::vector<std::unique_ptr<Base>>`**, never `std::vector<Base>`, for a polymorphic collection. **Make the base abstract** where you can: an abstract class cannot be constructed, so every one of the three slicing forms becomes a compile error instead of a wrong answer, which is the point lesson 4 made. **Or delete the copy operations** in the base — `Base(const Base&) = delete;` — which makes slicing impossible and is the right call for a base with identity. Finally, when you genuinely need polymorphic *values*, give the base a virtual `clone()` returning `unique_ptr<Base>` and copy through it; lesson 6 writes one with a covariant return type.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What happens when you delete a derived object through a base pointer with a non-virtual destructor?",
      answer:
        "It is undefined behaviour. Without `virtual`, the destructor call is bound statically from the pointer's type, so only `~Base` runs — the derived destructor never executes and everything the derived class owned leaks. The compiler also passes `sizeof(Base)` to the sized `operator delete` while the allocation was `sizeof(Derived)`, so the deallocation is wrong too. AddressSanitizer reports it as `new-delete-type-mismatch`, and GCC will warn at compile time with `-Wdelete-non-virtual-dtor`. The fix is `virtual ~Base() = default;`.",
    },
    {
      question: "What is the rule for when a base class needs a virtual destructor?",
      answer:
        "A base class destructor should be either public and virtual, or protected and non-virtual. Public and virtual whenever anyone might delete through a base pointer — any interface handed out as `unique_ptr<Base>` qualifies. Protected and non-virtual when the base is never deleted polymorphically, as with mixins and policy bases: it makes `delete basePtr` a compile error from outside while derived classes still destroy their base normally, and it avoids adding a vptr. The reason the rule is not just \"always add one\" is that a virtual destructor makes an otherwise non-polymorphic class polymorphic, adding 8 bytes per object and losing trivial copyability.",
    },
    {
      question: "Why does `shared_ptr` work without a virtual destructor when `unique_ptr` does not?",
      answer:
        "`unique_ptr`'s deleter is part of its type; `unique_ptr<Base>` uses `default_delete<Base>`, which does `delete` on a `Base*`, so the derived type is lost at conversion. `shared_ptr` type-erases its deleter into the control block, and captures it when the object is created — while the real type is still known — so `make_shared<Derived>()` records a deleter that calls `~Derived`, and that survives conversion to `shared_ptr<Base>`. It is not a licence to skip the virtual destructor: it makes correctness depend on which smart pointer a caller chose, and any raw `delete` or `unique_ptr` reintroduces the bug.",
    },
    {
      question: "What is object slicing, and where does it happen?",
      answer:
        "Copying a derived object into a base *object* rather than referring to it through a pointer or reference. The base variable is only `sizeof(Base)` bytes, so the base copy constructor copies the base subobject and the derived members are discarded — leaving a valid `Base` with a `Base` vptr that has lost its identity and no longer dispatches to overrides. It happens when passing by value, assigning a derived to a base variable, and inserting into a `std::vector<Base>`. It compiles silently, because a base-from-derived copy is legal and sometimes intended.",
    },
    {
      question: "How do you prevent slicing?",
      answer:
        "Take parameters as `const Base&` rather than `Base`, and store polymorphic collections as `vector<unique_ptr<Base>>` rather than `vector<Base>`. Better, make the base abstract where possible: an abstract class cannot be instantiated, so every form of slicing becomes a compile error rather than a wrong answer. You can also `= delete` the base's copy constructor and copy assignment, which makes the slice impossible to write. If you genuinely need value semantics over a hierarchy, give the base a virtual `clone()` returning `unique_ptr<Base>` and copy through that, or replace the hierarchy with a `std::variant`.",
    },
    {
      question: "Should you write `virtual ~Base() {}` or `virtual ~Base() = default;`?",
      answer:
        "`= default`. Both make the destructor virtual, but any user-*provided* destructor suppresses the implicitly generated move constructor and move assignment operator, so the class silently falls back to copying — a real and easily missed performance loss. `= default` is a user-declared but not user-provided destructor and keeps the class's other generated operations available where the rules allow. It also expresses the intent more clearly: you want the compiler's destructor, you only want it virtual.",
    },
  ],
  takeaways: [
    "`delete` through a base pointer with a non-virtual destructor is undefined behaviour, not just a leak",
    "The derived destructor is skipped and the wrong size is passed to `operator delete`",
    "AddressSanitizer reports it as `new-delete-type-mismatch`; GCC warns with `-Wdelete-non-virtual-dtor`",
    "That warning does not fire through `unique_ptr`, where the `delete` lives inside a template",
    "The rule: a base destructor is public and virtual, or protected and non-virtual",
    "Prefer `= default` to `{}` — a user-provided destructor suppresses the generated move operations",
    "`override` works on a destructor, and fails to compile if the base one is not virtual",
    "`shared_ptr` captures its deleter at creation, so it destroys correctly anyway — do not rely on it",
    "Slicing copies only the base subobject and silently discards the derived part",
    "It hides in by-value parameters, assignment to a base object, and `std::vector<Base>`",
    "Fix with `const Base&`, `vector<unique_ptr<Base>>`, an abstract base, or deleted copy operations",
  ],
  status: "available",
};
