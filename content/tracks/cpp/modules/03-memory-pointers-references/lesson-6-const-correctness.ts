import type { Lesson } from "@/content/types";

export const constCorrectnessLesson: Lesson = {
  id: "cpp-const-correctness",
  slug: "const-correctness",
  moduleSlug: "memory-pointers-references",
  title: "const Correctness",
  summary:
    "Reading `const` in a pointer declaration from right to left, what a `const` member function promises, why `const` overloads come in pairs, and why const correctness is nearly impossible to retrofit.",
  estimatedMinutes: 30,
  objectives: [
    "Read any `const` pointer declaration correctly using the right-to-left rule",
    "Distinguish pointer-to-const from const-pointer",
    "Write `const` member functions and understand what they promise",
    "Provide `const` and non-`const` overloads of an accessor",
    "Explain `mutable` and why it is not a hole in the guarantee",
  ],
  sections: [
    {
      id: "right-to-left",
      heading: "Reading const declarations",
      body: [
        "`const` applied to a pointer is the single most confused piece of C++ syntax, and there is a rule that makes it mechanical: **read the declaration right to left, starting from the variable name.**",
        "`const int* p` — read right to left: `p` is a *pointer* to an `int` that is `const`. **Pointer to const**: you may repoint it, you may not write through it.",
        "`int* const p` — `p` is a `const` *pointer* to an `int`. **Const pointer**: you may write through it, you may not repoint it.",
        "`const int* const p` — a const pointer to a const int. Neither.",
        "A quirk of the grammar: `const int` and `int const` mean the same thing, so `const int* p` and `int const* p` are identical. Some people write `int const*` precisely because the right-to-left rule then works with no exception. Both spellings are common; the first is more so.",
        "The rule of thumb that covers most real code: **`const` applies to whatever is immediately to its left, unless there is nothing to its left, in which case it applies to the right.**",
      ],
      examples: [
        {
          id: "const-pointer-forms",
          title: "All three forms, and what each permits",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    int a = 1, b = 2;

    const int* p1 = &a;        // pointer to const: cannot change *p1
    int* const p2 = &a;        // const pointer: cannot change p2
    const int* const p3 = &a;  // neither

    p1 = &b;                   // OK: repoint
    // *p1 = 5;                // ERROR: read-only target
    *p2 = 5;                   // OK: modify target
    // p2 = &b;                // ERROR: read-only pointer

    std::cout << a << ' ' << *p1 << ' ' << *p3 << '\\n';
}`,
          output: `5 2 5

// Uncommenting *p1 = 5 gives:
error: assignment of read-only location '* p1'
    5 |     *p1 = 5;
      |     ~~~^~~`,
          explanation:
            "Trace the output. `*p2 = 5` wrote through `p2` into `a`, so **`a` is 5**. `p1` was repointed to `b`, so **`*p1` is 2**. `p3` still points at `a`, so **`*p3` is 5**. The important observation: `p1` never modified anything, yet `a` changed — `const` on a pointer constrains *that pointer*, not the object. Another non-const path to the same object can still change it.",
        },
      ],
      pitfalls: [
        {
          title: "`const` on a pointer is a promise about the pointer, not the object",
          body: "A `const int*` means *this pointer* will not be used to modify the target. It does not mean the target is immutable — another pointer, a reference, or the variable's own name can still change it, and it may change between two reads through your const pointer. If you need genuine immutability, the *object* must be `const`. This distinction matters enormously in multithreaded code, where `const` is emphatically not a synchronisation guarantee.",
        },
      ],
    },
    {
      id: "const-members",
      heading: "const member functions",
      body: [
        "A member function declared `const` — the keyword goes **after** the parameter list — promises not to modify the object it is called on.",
        "The mechanism is that every non-static member function receives a hidden `this` pointer. In a non-const member function that is `T* const this`; in a `const` one it is `const T* const this`. So the promise is enforced by the same rules as any other pointer-to-const.",
        "This matters far beyond documentation, because **a `const` object can only have its `const` member functions called.** Since `const T&` is the standard way to pass a large object, any member function you forget to mark `const` becomes uncallable from most of your codebase — and then someone removes a `const` somewhere else to make it compile, and the property unravels.",
        "That cascade is why **const correctness is close to impossible to retrofit**, and why the advice is to mark member functions `const` from the moment you write them. It is one of the few things in C++ that is genuinely much cheaper to do up front.",
      ],
      examples: [
        {
          id: "const-member-overloads",
          title: "A const member function, and the overload pair",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

class Inventory {
public:
    void add(std::string item) { items_.push_back(std::move(item)); }

    // const member function: promises not to modify the object.
    std::size_t count() const { return items_.size(); }

    // Two overloads differing only in constness.
    const std::string& at(std::size_t i) const { return items_[i]; }
    std::string&       at(std::size_t i)       { return items_[i]; }

private:
    std::vector<std::string> items_;
};

void report(const Inventory& inv) {
    std::cout << inv.count() << " items, first is " << inv.at(0) << '\\n';
    // inv.add("x");        // ERROR: add() is not const
    // inv.at(0) = "y";     // ERROR: picks the const overload, returns const&
}

int main() {
    Inventory inv;
    inv.add("hammer");
    inv.add("nails");
    inv.at(0) = "sledgehammer";     // non-const object: picks the mutable overload
    report(inv);
}`,
          output: `2 items, first is sledgehammer`,
          explanation:
            "**`at` is overloaded on constness**, which is legal because `const` is part of the implicit `this` parameter. On a non-`const` object the compiler picks the non-const overload returning `std::string&`, so `inv.at(0) = \"sledgehammer\"` assigns. Inside `report`, where `inv` is `const Inventory&`, it picks the `const` overload returning `const std::string&`, so the same expression would not compile. **This pair is the standard shape for any accessor that hands out a reference**, and every standard container provides it.",
        },
      ],
      pitfalls: [
        {
          title: "The const overload pair duplicates the body",
          body: "Writing the same code twice is the obvious cost. The historical fix was `const_cast`, calling the const version from the non-const one — legal but ugly. Since C++23 there is a better answer: **deducing `this`**, which lets you write one templated member function that works for both constnesses. For C++20 and earlier, if the body is more than a line, factoring the shared logic into a private template is cleaner than casting.",
        },
      ],
    },
    {
      id: "propagation",
      heading: "How const propagates",
      body: [
        "Understanding what `const` does and does not reach is what makes it usable.",
        "**On a `const` object, every member is `const`.** You cannot assign to `member_` inside a `const` member function.",
        "**But `const` is shallow through pointers.** If a class holds a `T* data_`, then in a `const` member function the *pointer* is const — you cannot repoint it — while `*data_` is **not** const, and you may freely modify what it points at. This surprises people, and it is why `const` on a class holding raw pointers guarantees much less than it looks like it does. (`std::experimental::propagate_const` exists to fix this, and containers like `std::vector` handle it correctly by giving out `const` references from their `const` accessors.)",
        "**`const` does not propagate through a returned reference unless you make it.** An accessor returning a non-const reference from a `const` member function hands out a hole in the guarantee — which is exactly what the overload pair above prevents.",
      ],
      examples: [
        {
          id: "shallow-const",
          title: "const stops at the pointer",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>

class RawBuffer {
public:
    RawBuffer() : data_(new int[3]{1, 2, 3}) {}
    ~RawBuffer() { delete[] data_; }

    void surprising() const {
        // data_ = nullptr;    // ERROR: the POINTER is const
        data_[0] = 99;         // OK! the POINTEE is not
    }
    int first() const { return data_[0]; }

private:
    int* data_;
};

class VecBuffer {
public:
    VecBuffer() : data_{1, 2, 3} {}
    void not_allowed() const {
        // data_[0] = 99;      // ERROR: const propagates properly
    }
    int first() const { return data_[0]; }

private:
    std::vector<int> data_;
};

int main() {
    const RawBuffer raw;
    raw.surprising();
    std::cout << "raw first: " << raw.first() << '\\n';

    const VecBuffer vec;
    std::cout << "vec first: " << vec.first() << '\\n';
}`,
          output: `raw first: 99
vec first: 1`,
          explanation:
            "**A `const` object had its contents modified by a `const` member function.** No cast, no undefined behaviour — this is what the rules say. The `std::vector` version does not permit it, because `operator[]` on a `const std::vector` returns `const int&`. **This is a concrete argument for containers over raw pointers that has nothing to do with memory safety**: containers make `const` mean what you expect.",
        },
      ],
    },
    {
      id: "mutable",
      heading: "mutable, and why it is not cheating",
      body: [
        "`mutable` on a data member exempts it from `const`: it may be modified even inside a `const` member function, and even on a `const` object.",
        "This sounds like a loophole and is actually a recognition that **there are two kinds of constness.** *Bitwise* const means no byte of the object changes. *Logical* const means the object's observable value does not change. `const` member functions promise the second, and `mutable` is how you implement something that is logically const while being bitwise mutable.",
        "The legitimate uses are narrow and worth knowing: a memoisation cache, a mutex protecting the object's own data, and lazily computed derived state.",
        "A mutex is the clearest case. A `const` member function that reads shared data must lock, and locking modifies the mutex — so the mutex must be `mutable`. This is not a workaround; the standard library's own types do it, and `const` on a shared object is exactly the situation where thread safety matters.",
      ],
      examples: [
        {
          id: "mutable-cache",
          title: "The two legitimate uses",
          lang: "cpp",
          code: `#include <iostream>
#include <mutex>
#include <string>

class Document {
public:
    explicit Document(std::string text) : text_(std::move(text)) {}

    // Logically const: the document does not change, only the cache.
    std::size_t word_count() const {
        if (!counted_) {
            std::cout << "  (computing)\\n";
            words_ = 1;
            for (char c : text_) if (c == ' ') ++words_;
            counted_ = true;
        }
        return words_;
    }

    // A const read still has to lock, and locking mutates the mutex.
    std::string text() const {
        std::lock_guard<std::mutex> guard(mutex_);
        return text_;
    }

private:
    std::string text_;
    mutable bool counted_ = false;
    mutable std::size_t words_ = 0;
    mutable std::mutex mutex_;
};

int main() {
    const Document doc{"the quick brown fox"};
    std::cout << doc.word_count() << '\\n';
    std::cout << doc.word_count() << '\\n';   // cached: no recomputation
    std::cout << doc.text() << '\\n';
}`,
          output: `  (computing)
4
4
the quick brown fox`,
          explanation:
            "**\"(computing)\" prints once**, on a `const` object, calling a `const` member function that modified two members. The document's observable value never changed, which is what `const` actually promises. The `mutable std::mutex` is the pattern to remember — **without it, no `const` member function could ever be made thread-safe**, which would make `const` useless on shared objects.",
        },
      ],
      pitfalls: [
        {
          title: "`const` is not a thread-safety guarantee by itself",
          body: "The standard library guarantees that concurrent calls to `const` member functions of its own types are safe. For *your* types that is a convention you must uphold, not something the compiler checks — and a `mutable` member modified without a lock breaks it silently. Treat `const` as meaning \"safe to call concurrently\" when you design a type, and use a `mutable` mutex to make it true. Module 11 covers this properly.",
        },
      ],
    },
    {
      id: "practice",
      heading: "The discipline in practice",
      body: [
        "Six habits that together constitute const correctness. Applied from the start they cost nothing; applied later they are a large refactor.",
        "**Mark every member function `const` that does not modify the object.** Do it as you write it.",
        "**Take parameters by `const&`** for anything not small and cheap to copy.",
        "**Make local variables `const`** when they are not reassigned. This is free documentation and catches accidental assignment.",
        "**Return `const&` from accessors on `const` objects**, and provide the non-const overload where mutation is genuinely wanted.",
        "**Never use `const_cast` to remove `const` from something that is actually const.** Casting away the `const` on a reference to a genuinely `const` object and then writing through it is undefined behaviour, not a workaround. Its one defensible use is calling a legacy or C API that is missing `const` but does not actually modify.",
        "**Prefer `constexpr` where the value is known at compile time**, which is a stronger claim than `const` and enables more.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between `const int* p` and `int* const p`?",
      answer:
        "Read right to left from the name. `const int* p` is a pointer to a const int — you can repoint it but not write through it. `int* const p` is a const pointer to an int — you can write through it but not repoint it. `const int* const p` is neither. Note that `const int` and `int const` are synonyms, so `int const* p` is the same as `const int* p`; writing the `int const*` form makes the right-to-left rule work with no exception.",
    },
    {
      question: "What does a `const` member function promise, and how is it enforced?",
      answer:
        "That it will not modify the object it is called on. The mechanism is the hidden `this` parameter: in a non-const member function it is `T* const this`, and in a `const` one it is `const T* const this`, so the restriction follows from ordinary pointer-to-const rules. It matters because a `const` object can only have its `const` member functions called — and since `const T&` is the standard way to pass large objects, a member function you forget to mark `const` becomes uncallable from most of the codebase.",
    },
    {
      question: "Why do accessors often come in `const` and non-`const` pairs?",
      answer:
        "Because the same accessor should hand out a modifiable reference from a mutable object and a read-only one from a const object. Overloading on constness is legal since `const` is part of the implicit `this` parameter, so `at(i)` returning `T&` and `at(i) const` returning `const T&` coexist and the compiler picks by the object's constness. Every standard container does this. The cost is a duplicated body, which C++23's deducing-`this` finally lets you avoid with a single templated member.",
    },
    {
      question: "Does `const` propagate through a pointer member?",
      answer:
        "No — and this surprises people. In a `const` member function of a class holding a `T* data_`, the *pointer* is const so you cannot repoint it, but `*data_` is not const and you may freely modify the pointed-to data. So a `const` object can have its contents changed by a `const` member function, with no cast and no undefined behaviour. `std::vector` behaves correctly because its `const` `operator[]` returns a `const` reference, which is a concrete argument for containers over raw pointers quite apart from memory safety.",
    },
    {
      question: "What is `mutable` for, and does it break `const`?",
      answer:
        "It exempts a member from `const`, allowing modification inside `const` member functions. It does not break the guarantee because `const` member functions promise *logical* constness — that the observable value does not change — not bitwise constness. The legitimate uses are memoisation caches, lazily computed derived state, and a mutex protecting the object's own data. The mutex case is essential: a `const` read of shared data must lock, and locking mutates the mutex, so without `mutable` no `const` member function could ever be thread-safe.",
    },
  ],
  takeaways: [
    "Read const pointer declarations right to left from the variable name",
    "`const int*` is pointer-to-const (cannot write through); `int* const` is a const pointer (cannot repoint)",
    "`const` on a pointer constrains that pointer only — the object can still change through another path",
    "A `const` member function receives `const T* const this`, which is how the promise is enforced",
    "A `const` object can only call `const` member functions, so a missed `const` cascades across a codebase",
    "`const` is shallow through raw pointer members — containers propagate it correctly, raw pointers do not",
    "`mutable` implements logical constness; a `mutable` mutex is what makes a `const` member function thread-safe",
    "Never `const_cast` away `const` from a genuinely const object and write — that is undefined behaviour",
  ],
  status: "available",
};
