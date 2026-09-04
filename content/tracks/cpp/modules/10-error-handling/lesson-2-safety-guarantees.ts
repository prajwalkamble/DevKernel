import type { Lesson } from "@/content/types";

export const safetyGuaranteesLesson: Lesson = {
  id: "cpp-safety-guarantees",
  slug: "exception-safety-guarantees",
  moduleSlug: "error-handling",
  title: "The Exception Safety Guarantees: Basic, Strong & Nothrow",
  summary:
    "What it means for code to be exception safe, stated as four levels a function can promise. Two classes with the same interface measured against a forced failure — one left holding half its data, the other completely unchanged.",
  estimatedMinutes: 35,
  objectives: [
    "State the four levels and what each promises",
    "Identify which level a given function provides",
    "Explain why the basic guarantee is the minimum acceptable",
    "Recognise the build-aside-then-commit shape of strong safety",
    "Say when the strong guarantee is not worth its cost",
  ],
  sections: [
    {
      id: "the-levels",
      heading: "Four levels",
      body: [
        "Exception safety is not one property but a **promise a function makes about the state it leaves behind if it throws**. There are four levels, and every function you write provides one of them whether you thought about it or not.",
        "**No guarantee.** Anything may have happened: resources leaked, invariants broken, the object unusable and unsafe even to destroy. **This is not acceptable in any code**, and it is what you get by default from careless manual resource management.",
        "**Basic guarantee.** No resources leak, all invariants hold, and every object remains in a *valid but unspecified* state — usable and destructible, but not necessarily holding what it did before. **This is the minimum**, and it is what most well-written code provides.",
        "**Strong guarantee.** The operation either completes fully or has no effect at all. Commit-or-rollback: if it throws, the program state is exactly as before. This is what you want for anything a user retries.",
        "**Nothrow guarantee.** The operation cannot throw. Marked `noexcept`, and required of destructors, swaps and — as the next lesson shows — move operations, since those are the primitives the other guarantees are built out of.",
        "**The guarantee of a function is the weakest guarantee of anything it calls.** A function whose every operation is nothrow is nothrow; add one basic-guarantee call and the whole function drops to basic unless you do extra work.",
      ],
      examples: [
        {
          id: "basic-vs-strong",
          title: "The same operation at two levels, with a forced failure",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

// A throwing type, to force failure at a chosen point.
struct Fragile {
    static int throwOn;      // construct this many, then throw
    static int live;
    std::string tag;

    explicit Fragile(std::string t) : tag(std::move(t)) {
        if (throwOn == 0) throw std::runtime_error("Fragile ctor failed");
        if (throwOn > 0) --throwOn;
        ++live;
    }
    Fragile(const Fragile& o) : tag(o.tag) {
        if (throwOn == 0) throw std::runtime_error("Fragile copy failed");
        if (throwOn > 0) --throwOn;
        ++live;
    }
    ~Fragile() { --live; }
};
int Fragile::throwOn = -1;
int Fragile::live    = 0;

// BASIC GUARANTEE: no leak, object usable, but contents unspecified.
class BasicGuarantee {
public:
    void set(const std::string& a, const std::string& b) {
        items_.clear();
        items_.emplace_back(a);            // may throw after clear()
        items_.emplace_back(b);
    }
    std::size_t size() const { return items_.size(); }
private:
    std::vector<Fragile> items_;
};

// STRONG GUARANTEE: build aside, then commit with a non-throwing swap.
class StrongGuarantee {
public:
    void set(const std::string& a, const std::string& b) {
        std::vector<Fragile> fresh;
        fresh.reserve(2);
        fresh.emplace_back(a);             // any throw here leaves us untouched
        fresh.emplace_back(b);
        items_.swap(fresh);                // noexcept: the commit point
    }
    std::size_t size() const { return items_.size(); }
private:
    std::vector<Fragile> items_;
};

int main() {
    std::cout << "each object starts with 2 items, then set() throws on the 2nd\\n\\n";

    {
        std::cout << "BASIC guarantee:\\n";
        Fragile::throwOn = -1;
        BasicGuarantee b;
        b.set("a", "b");
        std::cout << "  size before = " << b.size() << '\\n';
        Fragile::throwOn = 1;              // allow one, then throw
        try { b.set("x", "y"); }
        catch (const std::exception& e) {
            std::cout << "  caught: " << e.what() << '\\n';
        }
        std::cout << "  size after  = " << b.size()
                  << "   <-- valid, but NOT what it was\\n";
    }

    {
        std::cout << "\\nSTRONG guarantee:\\n";
        Fragile::throwOn = -1;
        StrongGuarantee s;
        s.set("a", "b");
        std::cout << "  size before = " << s.size() << '\\n';
        Fragile::throwOn = 1;
        try { s.set("x", "y"); }
        catch (const std::exception& e) {
            std::cout << "  caught: " << e.what() << '\\n';
        }
        std::cout << "  size after  = " << s.size()
                  << "   <-- COMPLETELY unchanged\\n";
    }

    Fragile::throwOn = -1;
    std::cout << "\\nlive Fragile objects at exit: " << Fragile::live << '\\n';
}`,
          output: `each object starts with 2 items, then set() throws on the 2nd

BASIC guarantee:
  size before = 2
  caught: Fragile ctor failed
  size after  = 1   <-- valid, but NOT what it was

STRONG guarantee:
  size before = 2
  caught: Fragile ctor failed
  size after  = 2   <-- COMPLETELY unchanged

live Fragile objects at exit: 0`,
          explanation:
            "**Size 1 against size 2 — that is the entire difference between the two guarantees.** `BasicGuarantee` cleared first and then threw partway through refilling, leaving one element: the object is perfectly valid, destructible and usable, and holds neither the old data nor the new. `StrongGuarantee` built into a separate vector and only committed with a `noexcept` swap, so the failure happened before anything was touched. **Both leaked nothing** — `live` is 0 at exit — which is the basic guarantee both of them meet and which is the real minimum bar.",
        },
      ],
      pitfalls: [
        {
          title: "\"Valid but unspecified\" is a real state you must respect",
          body: "After a basic-guarantee operation throws, you may destroy the object, assign a new value to it, or call any operation with no precondition — `size()`, `empty()`, `clear()`. You may *not* assume it holds what it held before, and you may not call operations with preconditions you have not re-established. This is exactly the same contract as a moved-from object from module 5. In practice the safe response to a caught exception is to either discard the object or reset it to a known state, not to inspect it and continue.",
        },
      ],
    },
    {
      id: "achieving-strong",
      heading: "How the strong guarantee is achieved",
      body: [
        "Every strongly exception-safe operation has the same shape: **do all the work that can fail on a copy, then commit with an operation that cannot fail.**",
        "**Step one: perform every allocation and every potentially-throwing operation on temporary state.** If anything throws here, the real object has not been touched, so there is nothing to undo.",
        "**Step two: commit with a `noexcept` operation** — a `swap`, a pointer assignment, an integer store. The commit must be incapable of failing, because there is no way to recover halfway through it.",
        "The `StrongGuarantee` example above is exactly this: build `fresh`, then `swap`. The next lesson generalises it into copy-and-swap, which applies the same shape to assignment operators.",
        "**Ordering is the whole trick.** Module 5's copy assignment made the same point — allocate before you deallocate — and it is the same principle: arrange the code so that everything fallible happens before anything irreversible.",
        "**Some operations cannot be made strong at any reasonable price.** `std::vector::push_back` is strong. **`std::vector::insert` in the middle is only basic**, because making it strong would require copying the whole vector on every insertion. Multi-element operations on node-based containers, and anything whose rollback would itself need to allocate, are in the same position.",
      ],
      examples: [
        {
          id: "commit-shape",
          title: "The shape, applied to a class with two members that must agree",
          lang: "cpp",
          code: `#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

// Two members that must stay consistent: names and their lengths.
class Index {
public:
    // NOT strong: mutates members one at a time.
    void rebuildUnsafe(const std::vector<std::string>& input) {
        names_.clear();
        lengths_.clear();
        for (const auto& s : input) {
            if (s.empty()) throw std::invalid_argument("empty name");
            names_.push_back(s);
            lengths_.push_back(s.size());
        }
    }

    // STRONG: build both aside, commit with two noexcept swaps.
    void rebuildSafe(const std::vector<std::string>& input) {
        std::vector<std::string> newNames;
        std::vector<std::size_t> newLengths;
        newNames.reserve(input.size());
        newLengths.reserve(input.size());

        for (const auto& s : input) {                 // all failure happens here
            if (s.empty()) throw std::invalid_argument("empty name");
            newNames.push_back(s);
            newLengths.push_back(s.size());
        }

        names_.swap(newNames);                        // commit: noexcept
        lengths_.swap(newLengths);                    // commit: noexcept
    }

    bool consistent() const { return names_.size() == lengths_.size(); }
    std::size_t size() const { return names_.size(); }

private:
    std::vector<std::string> names_;
    std::vector<std::size_t> lengths_;
};

int main() {
    const std::vector<std::string> good{"alpha", "beta"};
    const std::vector<std::string> bad{"gamma", "", "delta"};

    Index a;
    a.rebuildSafe(good);
    std::cout << "unsafe rebuild, starting from size " << a.size() << '\\n';
    try { a.rebuildUnsafe(bad); }
    catch (const std::exception& e) { std::cout << "  caught: " << e.what() << '\\n'; }
    std::cout << "  size = " << a.size()
              << ", consistent = " << a.consistent() << "  <-- data lost\\n";

    Index b;
    b.rebuildSafe(good);
    std::cout << "\\nsafe rebuild, starting from size " << b.size() << '\\n';
    try { b.rebuildSafe(bad); }
    catch (const std::exception& e) { std::cout << "  caught: " << e.what() << '\\n'; }
    std::cout << "  size = " << b.size()
              << ", consistent = " << b.consistent() << "  <-- untouched\\n";
}`,
          output: `unsafe rebuild, starting from size 2
  caught: empty name
  size = 1, consistent = 1  <-- data lost

safe rebuild, starting from size 2
  caught: empty name
  size = 2, consistent = 1  <-- untouched`,
          explanation:
            "**Note that both versions stayed consistent** — `names_` and `lengths_` had matching sizes in each case, because the unsafe version happened to push to both before the failure. Consistency is the basic guarantee, and it is not the same as the strong one: the unsafe rebuild still destroyed the original two entries and left one. The safe version's two swaps are the commit, and both are `noexcept`, which is what makes the pair atomic in effect.",
        },
      ],
    },
    {
      id: "when-not-to",
      heading: "When the strong guarantee is the wrong choice",
      body: [
        "The strong guarantee is not free and is not always achievable, and pretending otherwise leads to worse code than admitting the basic guarantee.",
        "**It costs a copy.** Building aside means duplicating whatever the operation touches. For a container holding a million elements, a strongly safe modification allocates a second million-element buffer. That can turn an O(1) operation into O(n) in both time and peak memory.",
        "**It is sometimes impossible.** An operation with side effects outside the program — a network send, a write to a file, a database commit — cannot be rolled back by C++, and no amount of local copying makes it atomic.",
        "**It can conflict with efficiency in the library itself.** As the next-but-one lesson shows, `std::vector` chooses between moving and copying during reallocation *specifically* to preserve the strong guarantee, and pays with a full copy when the element's move constructor is not `noexcept`.",
        "**The practical policy**: provide the basic guarantee everywhere as a baseline; provide the strong guarantee where it is cheap — assignment operators via copy-and-swap, single-element container insertion, operations that already build a result — and document honestly when you only provide the basic one. **A documented basic guarantee is far better than an undocumented, accidental, almost-strong one.**",
      ],
      examples: [
        {
          id: "stdlib-guarantees",
          title: "What the standard library promises",
          lang: "cpp",
          code: `// NOTHROW (marked noexcept, will not throw):
//   ~T() for every standard type
//   swap on all standard containers
//   move constructor / move assignment for most standard types
//   vector::pop_back, clear, size, empty, capacity
//   unique_ptr / shared_ptr destruction and reset
//
// STRONG (completes fully or has no effect):
//   vector::push_back, emplace_back        -- reallocation is done aside
//   vector::insert of a SINGLE element
//   vector::reserve
//   map/set::insert of a single element
//   any copy assignment written with copy-and-swap
//
// BASIC (no leak, valid but unspecified):
//   vector::insert of a RANGE
//   vector::erase of a range
//   vector::resize
//   std::sort and most mutating algorithms
//   anything taking a user comparator or predicate that may throw
//
// Note the pattern: SINGLE-element operations tend to be strong because the
// rollback is cheap; MULTI-element ones are basic because making them strong
// would mean copying the whole container.
//
// And one special case worth remembering:
//   vector reallocation uses MOVE only if the element's move constructor is
//   noexcept -- otherwise it COPIES, to preserve the strong guarantee.
//   That is lesson 4.`,
          output: `# The rule of thumb:
#   destructors and swaps never throw,
#   single-element inserts are strong,
#   range operations are basic.`,
          explanation:
            "**The single-versus-multi-element split is the pattern worth internalising.** `push_back` can be strong because rolling back one insertion is trivial — if the reallocation throws, the old buffer is still intact and untouched. A range insert would have to undo an arbitrary number of constructions, so the standard settles for basic. When you design your own containers, the same economics apply, and copying the standard library's choices is usually right.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are the exception safety guarantees?",
      answer:
        "Four levels. No guarantee: anything may have happened, resources leaked, invariants broken — never acceptable. Basic: nothing leaks, all invariants hold, and every object is left valid but unspecified — usable and destructible, though not necessarily holding what it did before. This is the minimum bar. Strong: the operation completes fully or has no effect, so state is exactly as before if it throws. Nothrow: the operation cannot throw, marked `noexcept`, and required of destructors, swaps and move operations. A function's guarantee is the weakest guarantee of anything it calls.",
    },
    {
      question: "What does \"valid but unspecified\" actually permit?",
      answer:
        "You may destroy the object, assign a new value to it, and call any operation that has no precondition — `size()`, `empty()`, `clear()`. You may not assume it holds its previous contents, and you may not call operations whose preconditions you have not re-established. It is the same contract as a moved-from object. In practice, the correct response to catching an exception from a basic-guarantee operation is to discard the object or reset it to a known state, not to inspect it and carry on as though the failure were partial.",
    },
    {
      question: "How do you make an operation strongly exception safe?",
      answer:
        "Do everything that can fail on temporary state, then commit with an operation that cannot fail. All allocation and all potentially-throwing work happens on a copy, so a throw leaves the real object untouched and there is nothing to undo; the commit is a `noexcept` operation such as a `swap`, a pointer assignment or an integer store. The ordering is the entire trick — arrange the code so everything fallible precedes anything irreversible, which is the same principle as allocating before deallocating in a copy assignment operator. Copy-and-swap is the packaged version of this shape.",
    },
    {
      question: "When is the strong guarantee not worth providing?",
      answer:
        "When the copy is expensive: building aside duplicates everything the operation touches, so a strongly safe modification of a million-element container allocates a second million-element buffer, turning an O(1) operation into O(n) in time and peak memory. When the operation has effects outside the program — a network send, a file write, a database commit — since C++ cannot roll those back. And when the rollback would itself need to allocate and could therefore fail. The right policy is basic everywhere as a baseline, strong where it is cheap, and honest documentation of which you provide.",
    },
    {
      question: "Which standard library operations are strong and which are basic?",
      answer:
        "Roughly, single-element operations are strong and multi-element ones are basic. `vector::push_back`, `emplace_back`, single-element `insert` and `reserve` are strong, as are `map` and `set` single-element inserts — rolling back one insertion is cheap because the old buffer is untouched. Range inserts, range erases, `resize`, `std::sort` and most mutating algorithms are basic, because making them strong would mean copying the whole container. Destructors, swaps and most move operations are nothrow. One special case: `vector` reallocation moves elements only if their move constructor is `noexcept`, and otherwise copies, precisely to preserve the strong guarantee.",
    },
  ],
  takeaways: [
    "Four levels: no guarantee, basic, strong, nothrow",
    "The basic guarantee — no leaks, invariants hold, valid but unspecified — is the minimum",
    "The strong guarantee means the operation completes fully or has no effect at all",
    "Nothrow is required of destructors, swaps and move operations",
    "A function's guarantee is the weakest guarantee of anything it calls",
    "\"Valid but unspecified\" permits destruction and assignment, not assumptions about contents",
    "Strong safety always has the same shape: do fallible work aside, commit with something `noexcept`",
    "Arrange code so everything that can fail precedes anything irreversible",
    "The strong guarantee costs a copy, and is impossible for effects outside the program",
    "In the standard library, single-element operations are strong and range operations are basic",
    "A documented basic guarantee beats an accidental almost-strong one",
  ],
  status: "available",
};
