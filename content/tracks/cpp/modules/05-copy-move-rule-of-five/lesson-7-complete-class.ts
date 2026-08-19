import type { Lesson } from "@/content/types";

export const completeClassLesson: Lesson = {
  id: "cpp-complete-class",
  slug: "writing-a-resource-owning-class",
  moduleSlug: "copy-move-rule-of-five",
  title: "Writing a Resource-Owning Class End to End",
  summary:
    "Everything in this module applied to one class. The copy-and-swap idiom, which collapses copy and move assignment into a single function that is self-assignment-safe and strongly exception-safe by construction — and how to test all five operations.",
  estimatedMinutes: 40,
  objectives: [
    "Write a complete resource-owning class with all five special members",
    "Apply the copy-and-swap idiom and explain what it guarantees",
    "Write a correct non-member `swap` and say why `using std::swap` matters",
    "Test every one of the five operations, including self-assignment",
    "Judge when copy-and-swap is the wrong choice",
  ],
  sections: [
    {
      id: "copy-and-swap",
      heading: "The copy-and-swap idiom",
      body: [
        "Lesson 1 wrote copy assignment with a self-assignment guard and careful ordering. Lesson 3 wrote move assignment separately. **Copy-and-swap replaces both with one function**, and gets two guarantees for free.",
        "The trick is to take the parameter **by value**.",
        "That single decision does the work. When called with an lvalue, the parameter is copy-constructed; when called with an rvalue, it is move-constructed. **The copy or move has already happened before the body runs, performed by the constructor you already wrote and tested.** The body then just swaps the parameter's contents with `*this`, and the parameter — now holding the old state — is destroyed at the closing brace, releasing it.",
        "**Self-assignment becomes harmless.** `a = a` copies `a` into the parameter first, so the swap is against an independent copy. No check needed.",
        "**You get the strong exception guarantee.** Any allocation happens while constructing the parameter, *before* `*this` is touched. If it throws, the object is completely unmodified. Swapping itself cannot throw.",
        "**And one function serves both.** No duplicated logic between copy assignment and move assignment.",
      ],
      examples: [
        {
          id: "copy-and-swap-class",
          title: "The complete class",
          lang: "cpp",
          code: `#include <algorithm>
#include <iostream>
#include <utility>

class DynArray {
public:
    explicit DynArray(std::size_t n = 0)
        : size_(n), data_(n ? new int[n]{} : nullptr) {}

    DynArray(const DynArray& other)
        : size_(other.size_), data_(other.size_ ? new int[other.size_] : nullptr) {
        std::copy(other.data_, other.data_ + size_, data_);
        std::cout << "  copy ctor\\n";
    }

    DynArray(DynArray&& other) noexcept
        : size_(std::exchange(other.size_, 0)),
          data_(std::exchange(other.data_, nullptr)) {
        std::cout << "  move ctor\\n";
    }

    // Copy-and-swap: one operator handles both copy and move assignment.
    // The parameter is by value, so the caller's copy or move already happened.
    DynArray& operator=(DynArray other) noexcept {
        std::cout << "  unified assign\\n";
        swap(*this, other);
        return *this;
    }

    ~DynArray() { delete[] data_; }

    friend void swap(DynArray& a, DynArray& b) noexcept {
        using std::swap;
        swap(a.size_, b.size_);
        swap(a.data_, b.data_);
    }

    std::size_t size() const { return size_; }
    int&       operator[](std::size_t i)       { return data_[i]; }
    const int& operator[](std::size_t i) const { return data_[i]; }

private:
    std::size_t size_;
    int*        data_;
};

int main() {
    DynArray a{3};
    a[0] = 10; a[1] = 20; a[2] = 30;

    std::cout << "copy construct:\\n";  DynArray b = a;
    std::cout << "move construct:\\n";  DynArray c = std::move(b);
    std::cout << "copy assign:\\n";     DynArray d; d = a;
    std::cout << "move assign:\\n";     DynArray e; e = std::move(c);
    std::cout << "self assign:\\n";     d = d;

    std::cout << "a[1]=" << a[1] << " d[1]=" << d[1] << " e[2]=" << e[2] << '\\n';
    std::cout << "b.size()=" << b.size() << " c.size()=" << c.size() << '\\n';
}`,
          output: `copy construct:
  copy ctor
move construct:
  move ctor
copy assign:
  copy ctor
  unified assign
move assign:
  move ctor
  unified assign
self assign:
  copy ctor
  unified assign
a[1]=20 d[1]=20 e[2]=30
b.size()=0 c.size()=0`,
          explanation:
            "**Read the assign cases.** Copy assignment shows `copy ctor` then `unified assign` — the parameter was copy-constructed, then swapped in. Move assignment shows `move ctor` then the same assign. **Self-assignment shows a `copy ctor` too**, which is the cost of the idiom: `d = d` really does copy, then swap with itself, then destroy the copy. Correct, but not free — which is the one genuine objection to copy-and-swap. Clean under `-fsanitize=address,undefined` with no errors and no leaks.",
        },
      ],
    },
    {
      id: "swap",
      heading: "Writing swap correctly",
      body: [
        "The `swap` above has three deliberate details.",
        "**It is a non-member `friend` defined inside the class.** That makes it findable by argument-dependent lookup, which is how generic code discovers it — `std::sort` and the standard algorithms call an unqualified `swap(a, b)` precisely so that a type's own overload wins.",
        "**It is `noexcept`.** Swapping pointers and integers cannot fail, and copy-and-swap's exception guarantee depends on it.",
        "**It contains `using std::swap;` before the calls.** This is the *two-step* idiom: bring `std::swap` into scope as a fallback, then call `swap` unqualified so that a better overload for the member type is found by ADL if one exists. Writing `std::swap(a.data_, b.data_)` directly would force the generic version and miss any specialisation.",
        "For members that are themselves standard types, `std::swap` is already efficient — `std::vector`'s swap exchanges pointers, it does not copy elements.",
      ],
      examples: [
        {
          id: "swap-two-step",
          title: "Why the two-step matters",
          lang: "cpp",
          code: `#include <iostream>
#include <utility>

namespace lib {
    struct Special {
        int value;
    };
    // A type-specific swap, findable only by ADL.
    void swap(Special& a, Special& b) noexcept {
        std::cout << "  [lib::swap used]\\n";
        std::swap(a.value, b.value);
    }
}

template <typename T>
void wrong(T& a, T& b) {
    std::swap(a, b);            // forces the generic version
}

template <typename T>
void right(T& a, T& b) {
    using std::swap;            // fallback
    swap(a, b);                 // ADL finds lib::swap if it exists
}

int main() {
    lib::Special x{1}, y{2};
    std::cout << "wrong():\\n"; wrong(x, y);
    std::cout << "right():\\n"; right(x, y);
    std::cout << "x=" << x.value << " y=" << y.value << '\\n';
}`,
          output: `wrong():
right():
  [lib::swap used]
x=1 y=2`,
          explanation:
            "**`wrong()` silently used `std::swap`** — which for `Special` means three moves of the whole struct rather than the type's own implementation. For a struct of one `int` that is irrelevant; for a type whose specialised swap avoids an allocation, it is not. Note the final values: two swaps returned `x` and `y` to their starting values, which is the correct result. **`using std::swap; swap(a, b);` is the form to write in any generic code.**",
        },
      ],
      pitfalls: [
        {
          title: "Do not specialise `std::swap` — overload in your own namespace instead",
          body: "Adding new specialisations to namespace `std` is permitted only for a narrow set of templates, and overloading a function template in `std` is undefined behaviour. The correct approach is a non-member `swap` in the same namespace as your type — as a hidden `friend` inside the class is cleanest — and let ADL find it. Every standard algorithm calls unqualified `swap` after `using std::swap`, so your overload will be selected.",
        },
      ],
    },
    {
      id: "testing",
      heading: "Testing all five",
      body: [
        "A resource-owning class has five operations that can each be individually wrong, and the failure modes are memory bugs rather than wrong answers — so a test that only checks values will pass on code that leaks or double-frees.",
        "**Test each of the five explicitly**, and then run the tests under AddressSanitizer. The sanitizer is what turns \"the values were right\" into \"the memory was right too\".",
        "The cases that actually catch bugs, in rough order of how often they find something:",
        "**Self-assignment** — `a = a`. Catches the missing guard.",
        "**Assignment to a non-empty object** — the old resource must be released, or you leak.",
        "**Move, then use the source** — assign to it and destroy it, confirming it was left valid.",
        "**Move, then check the source is empty** — confirms the reset actually happened, so no double ownership.",
        "**Copy, then modify one** — confirms the copy is deep rather than shallow.",
        "**Construct and destroy in a loop** — under ASan, a leak of any size is reported.",
      ],
      examples: [
        {
          id: "five-operation-test",
          title: "A test that would catch each bug",
          lang: "cpp",
          code: `#include <cassert>
#include <iostream>
#include <utility>
#include <vector>

// (DynArray from earlier in this lesson.)
#include "dynarray.h"

int main() {
    // 1. Copy is deep: modifying the copy must not touch the original.
    {
        DynArray a{3}; a[0] = 1;
        DynArray b = a; b[0] = 99;
        assert(a[0] == 1 && b[0] == 99);
    }

    // 2. Move transfers, and empties the source.
    {
        DynArray a{4};
        DynArray b = std::move(a);
        assert(b.size() == 4);
        assert(a.size() == 0);        // reset actually happened
    }

    // 3. A moved-from object is still valid: assignable and destructible.
    {
        DynArray a{2};
        DynArray b = std::move(a);
        a = DynArray{7};              // reuse after move
        assert(a.size() == 7);
    }

    // 4. Self-assignment leaves the object intact.
    {
        DynArray a{3}; a[1] = 42;
        a = a;
        assert(a.size() == 3 && a[1] == 42);
    }

    // 5. Assigning over a non-empty object releases the old buffer.
    //    A leak here is invisible to assert -- ASan is what catches it.
    {
        DynArray a{1000};
        for (int i = 0; i < 100; ++i) a = DynArray{1000};
        assert(a.size() == 1000);
    }

    // 6. Works inside a container, which exercises reallocation.
    {
        std::vector<DynArray> v;
        for (int i = 0; i < 50; ++i) v.emplace_back(10);
        assert(v.size() == 50);
    }

    std::cout << "all five operations pass\\n";
}`,
          output: `$ g++ -std=c++20 -g -fsanitize=address,undefined test.cpp -o test && ./test
all five operations pass

# no leaks, no errors: exit status 0`,
          explanation:
            "**Case 5 is the one that only works with a sanitizer.** The assertion checks the size, which would pass even if every one of those 100 assignments leaked a 1000-element buffer. AddressSanitizer reports it as `Direct leak of 400000 byte(s) in 100 objects`. **Case 6 exercises the `noexcept` on the move constructor** — remove it and `std::vector` copies during reallocation, which is not an error but is a silent performance regression, and this is where you would notice.",
        },
      ],
    },
    {
      id: "when-not",
      heading: "When copy-and-swap is the wrong choice",
      body: [
        "It is an excellent default and it is not universal. Three cases where the separate operations are better.",
        "**When move assignment must be fast.** Copy-and-swap makes move assignment cost a move-construct plus a swap plus a destruction of the old state. A hand-written move assignment releases and steals directly. For a type assigned in a hot loop, that difference is measurable.",
        "**When assignment can reuse existing capacity.** This is the important one. `std::vector::operator=` copying a 100-element vector into one that already has capacity for 200 copies the elements into the existing buffer with **no allocation at all**. Copy-and-swap always allocates a fresh buffer and throws the old one away. That is why the standard library does *not* use copy-and-swap for its containers.",
        "**When the copy constructor is expensive and self-assignment is common.** Copy-and-swap performs a full copy even for `a = a`.",
        "So: **use copy-and-swap by default for your own resource-owning types**, where clarity and correctness dominate. Write the operations separately when you have measured that assignment is hot, or when reusing existing capacity would avoid an allocation.",
      ],
      examples: [
        {
          id: "capacity-reuse",
          title: "What copy-and-swap gives up",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> destination;
    destination.reserve(1000);
    const int* buffer_before = destination.data();

    std::vector<int> source(500, 7);

    destination = source;              // copy assignment into existing capacity

    std::cout << "same buffer reused? " << std::boolalpha
              << (destination.data() == buffer_before) << '\\n';
    std::cout << "size=" << destination.size()
              << " capacity=" << destination.capacity() << '\\n';
}`,
          output: `same buffer reused? true
size=500 capacity=1000`,
          explanation:
            "**The buffer address is unchanged and the capacity is still 1000** — `std::vector`'s copy assignment copied 500 elements into storage it already owned, with no allocation. A copy-and-swap implementation would have allocated a fresh 500-element buffer, swapped it in, and freed the 1000-element one. In a loop that assigns repeatedly, that is one allocation and one deallocation per iteration against none. **This is the concrete reason the standard library writes the operations separately**, and the concrete reason you should too once you have measured a need.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the copy-and-swap idiom and what does it guarantee?",
      answer:
        "Take the assignment parameter **by value**, then swap its contents with `*this`; the parameter, now holding the old state, is destroyed at the closing brace. Because the parameter is by value, the caller's lvalue is copy-constructed and an rvalue is move-constructed, so one operator handles both copy and move assignment. It gives you two guarantees for free: self-assignment is harmless, since you swapped against an independent copy, and you get the strong exception guarantee, because any allocation happens while constructing the parameter before `*this` is touched.",
    },
    {
      question: "Why write `using std::swap; swap(a, b);` rather than `std::swap(a, b)`?",
      answer:
        "So argument-dependent lookup can find a type-specific `swap` if one exists, falling back to `std::swap` if not. Writing `std::swap` directly forces the generic three-move version and silently bypasses any specialised implementation — which for a type whose swap avoids an allocation is a real loss. This two-step is what every standard algorithm does internally. The corollary is that you should provide your own `swap` as a non-member in your type's namespace, ideally a hidden `friend`, rather than specialising `std::swap` — overloading a function template in namespace `std` is undefined behaviour.",
    },
    {
      question: "When would you not use copy-and-swap?",
      answer:
        "When move assignment needs to be fast, since copy-and-swap costs a move-construct plus a swap plus destroying the old state where a hand-written version releases and steals directly. When assignment could reuse existing capacity — `std::vector::operator=` copies into an existing buffer with no allocation at all, which copy-and-swap always throws away, and that is exactly why the standard library does not use it for containers. And when copies are expensive and self-assignment is common, since copy-and-swap fully copies even for `a = a`.",
    },
    {
      question: "How would you test a resource-owning class?",
      answer:
        "Exercise all five operations and run the tests under AddressSanitizer, because the failure modes are memory bugs rather than wrong values. The cases that find real bugs: self-assignment; assignment to a non-empty object, which must release the old resource; move then reuse the source, confirming it was left valid; move then check the source is empty, confirming the reset happened; copy then modify one, confirming the copy is deep; and construction inside a `std::vector` so reallocation exercises the move. The leak case in particular passes every value assertion and is only caught by the sanitizer.",
    },
    {
      question: "Why does the assign parameter being by value make self-assignment safe?",
      answer:
        "Because by the time the body runs, the parameter is already an independent copy of the argument — the copy constructor ran before the function was entered. So `a = a` swaps `a` with a copy of `a`, which leaves `a` holding equivalent contents, and then destroys the copy holding the old ones. No explicit `if (this == &other)` guard is needed. The cost is that self-assignment performs a genuine full copy, which is the idiom's one real inefficiency.",
    },
  ],
  takeaways: [
    "Copy-and-swap takes the parameter by value, so the caller's copy or move happens before the body runs",
    "One `operator=(T other)` serves both copy and move assignment with no duplicated logic",
    "Self-assignment is safe by construction — you swap against an independent copy",
    "It gives the strong exception guarantee: allocation happens before `*this` is touched",
    "Write `swap` as a `noexcept` hidden `friend`, and use `using std::swap;` then unqualified `swap` inside it",
    "Never specialise or overload `std::swap` — overload in your own namespace and let ADL find it",
    "Test all five operations under AddressSanitizer; a leak passes every value assertion",
    "Skip copy-and-swap where assignment is hot or could reuse capacity — that is why `std::vector` does not use it",
  ],
  status: "available",
};
