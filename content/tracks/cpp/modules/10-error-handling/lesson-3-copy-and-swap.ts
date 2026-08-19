import type { Lesson } from "@/content/types";

export const copyAndSwapLesson: Lesson = {
  id: "cpp-copy-and-swap",
  slug: "copy-and-swap",
  moduleSlug: "error-handling",
  title: "Writing Strongly Exception-Safe Code with Copy-and-Swap",
  summary:
    "One assignment operator that handles copying and moving, survives self-assignment without a check, and is strongly exception safe by construction — because the parameter is taken by value and the only thing left to do cannot fail.",
  estimatedMinutes: 35,
  objectives: [
    "Write copy-and-swap and explain each of its guarantees",
    "Say why taking the parameter by value is the whole trick",
    "Write a correct non-member `swap` and explain `using std::swap`",
    "Explain why self-assignment needs no check",
    "Judge when copy-and-swap is the wrong choice",
  ],
  sections: [
    {
      id: "the-idiom",
      heading: "The idiom",
      body: [
        "Module 5 wrote copy assignment with a self-assignment guard and careful allocate-before-deallocate ordering, and move assignment as a separate function. **Copy-and-swap replaces both with one function** and gets three properties for free.",
        "**The trick is taking the parameter by value.**",
        "That single decision does all the work. Called with an lvalue, the parameter is *copy*-constructed; called with an rvalue, it is *move*-constructed. **The copy or move has already happened before the body runs**, performed by the constructor you already wrote and tested. The body then swaps the parameter's contents with `*this`, and the parameter — now holding the old state — is destroyed at the closing brace, releasing it.",
        "**Self-assignment becomes harmless.** `a = a` copies `a` into the parameter first, so the swap is against an independent copy. No check needed, and no branch in the common path.",
        "**You get the strong guarantee.** Every allocation happens while constructing the parameter, *before* `*this` is touched. If it throws, the exception propagates out of the parameter's construction and the object is completely unmodified. The swap itself is `noexcept`, so once you reach it nothing can fail — which is exactly the build-aside-then-commit shape from the previous lesson.",
        "**And one function serves both**, with no duplicated logic between copy and move assignment.",
      ],
      examples: [
        {
          id: "copy-and-swap",
          title: "One operator, three call sites, no explicit checks",
          lang: "cpp",
          code: `#include <algorithm>
#include <iostream>
#include <utility>

class Buffer {
public:
    explicit Buffer(std::size_t n, const char* tag = "?")
        : size_(n), data_(n ? new int[n]{} : nullptr), tag_(tag) {
        std::cout << "    ctor  " << tag_ << " (" << size_ << ")\\n";
    }

    Buffer(const Buffer& o)
        : size_(o.size_), data_(o.size_ ? new int[o.size_] : nullptr),
          tag_(o.tag_) {
        std::copy(o.data_, o.data_ + size_, data_);
        std::cout << "    copy  " << tag_ << '\\n';
    }

    Buffer(Buffer&& o) noexcept
        : size_(std::exchange(o.size_, 0)),
          data_(std::exchange(o.data_, nullptr)),
          tag_(std::exchange(o.tag_, "moved-from")) {
        std::cout << "    move  " << tag_ << '\\n';
    }

    // ONE assignment operator handles copy AND move.
    // The parameter is by value, so the caller's copy/move already happened.
    Buffer& operator=(Buffer other) noexcept {
        std::cout << "    assign (unified)\\n";
        swap(*this, other);
        return *this;
    }

    ~Buffer() { delete[] data_; }

    friend void swap(Buffer& a, Buffer& b) noexcept {
        using std::swap;
        swap(a.size_, b.size_);
        swap(a.data_, b.data_);
        swap(a.tag_,  b.tag_);
    }

    std::size_t size() const { return size_; }
    const char* tag()  const { return tag_; }

private:
    std::size_t size_;
    int*        data_;
    const char* tag_;
};

int main() {
    std::cout << "construct two buffers:\\n";
    Buffer a{4, "A"};
    Buffer b{2, "B"};

    std::cout << "\\ncopy assignment (lvalue -> parameter is COPY-constructed):\\n";
    a = b;
    std::cout << "  a is now " << a.tag() << " size " << a.size() << '\\n';

    std::cout << "\\nmove assignment (rvalue -> parameter is MOVE-constructed):\\n";
    a = Buffer{7, "C"};
    std::cout << "  a is now " << a.tag() << " size " << a.size() << '\\n';

    std::cout << "\\nself-assignment is harmless with no explicit check:\\n";
    a = a;
    std::cout << "  a is still " << a.tag() << " size " << a.size() << '\\n';

    std::cout << "\\ndestructors:\\n";
}`,
          output: `construct two buffers:
    ctor  A (4)
    ctor  B (2)

copy assignment (lvalue -> parameter is COPY-constructed):
    copy  B
    assign (unified)
  a is now B size 2

move assignment (rvalue -> parameter is MOVE-constructed):
    ctor  C (7)
    assign (unified)
  a is now C size 7

self-assignment is harmless with no explicit check:
    copy  C
    assign (unified)
  a is still C size 7

destructors:

$ g++ -fsanitize=address ... && ./buffer
[clean, no errors, no leaks]`,
          explanation:
            "**One `operator=` served three different assignments.** The lvalue case copy-constructed the parameter; the rvalue case constructed `C` directly into it — note there is no separate `move` line, because the temporary was built straight into the parameter by copy elision. Self-assignment copied first and then swapped against the copy, so it was correct without any `if (this == &other)`. And the old state went out with the parameter at the closing brace, which is why the destructor count balances and ASan reports nothing.",
        },
      ],
    },
    {
      id: "the-swap",
      heading: "Writing the `swap`",
      body: [
        "The idiom depends entirely on `swap` being correct and **`noexcept`**. If the swap could throw, the commit could fail halfway and the strong guarantee evaporates.",
        "**Write it as a non-member `friend` function** found by argument-dependent lookup, not only as a member. That is what allows generic code — including standard algorithms — to find it by writing an unqualified `swap(a, b)`.",
        "**The `using std::swap;` line inside is essential.** It brings `std::swap` into scope as a *fallback* so the unqualified calls that follow use ADL to find a member-specific `swap` if one exists, and `std::swap` otherwise. Writing `std::swap(a.member_, b.member_)` directly would force the generic three-move version and skip any better overload the member type provides.",
        "This is the **\"std two-step\"**, and it appears throughout well-written generic code. The shape is always: `using std::swap;` then unqualified `swap(x, y);`.",
        "**Swap every member.** Forgetting one leaves the two objects with mixed state, and it is a bug that survives most testing because the forgotten member is usually the least-used one.",
      ],
      examples: [
        {
          id: "std-two-step",
          title: "Why the unqualified call matters",
          lang: "cpp",
          code: `#include <iostream>
#include <utility>

namespace lib {
    struct Special {
        int id;
        // A cheap, specialised swap this type wants used.
        friend void swap(Special& a, Special& b) noexcept {
            std::cout << "      [Special::swap used]\\n";
            std::swap(a.id, b.id);
        }
    };
}

// WRONG: forces std::swap, ignoring any better overload.
template <typename T>
void swapWrong(T& a, T& b) {
    std::swap(a, b);
}

// RIGHT: the "std two-step" -- fallback in scope, call unqualified.
template <typename T>
void swapRight(T& a, T& b) {
    using std::swap;
    swap(a, b);
}

int main() {
    lib::Special x{1}, y{2};

    std::cout << "swapWrong (qualified std::swap):\\n";
    swapWrong(x, y);
    std::cout << "      -> " << x.id << ' ' << y.id << '\\n';

    std::cout << "swapRight (using std::swap; then unqualified):\\n";
    swapRight(x, y);
    std::cout << "      -> " << x.id << ' ' << y.id << '\\n';
}`,
          output: `swapWrong (qualified std::swap):
      -> 2 1
swapRight (using std::swap; then unqualified):
      [Special::swap used]
      -> 1 2`,
          explanation:
            "**Only the unqualified call found `Special`'s own swap.** `std::swap(a, b)` names one specific function and does the generic three-move dance; `using std::swap;` followed by `swap(a, b)` lets argument-dependent lookup find the type's own overload and falls back to `std::swap` when there is none. For a type where swapping is cheaper than three moves — or where the generic version would be wrong — this is the difference between correct and merely working.",
        },
      ],
    },
    {
      id: "costs",
      heading: "When not to use it",
      body: [
        "Copy-and-swap is an excellent default and it is not universally right.",
        "**It always allocates.** Assigning a 1000-element buffer to another 1000-element buffer allocates a second one, copies, swaps and frees — where a hand-written assignment could have reused the existing storage and just copied the elements. For a hot assignment path on same-sized objects, that is a real and avoidable cost.",
        "**That is exactly why `std::vector` does not use it.** `vector::operator=` reuses the existing capacity when it is large enough, which is why assigning between vectors of similar size does not allocate. It gives up the strong guarantee for range assignment in exchange, and documents the basic one.",
        "**It makes move assignment slightly more expensive than a hand-written one.** The unified operator move-constructs the parameter, swaps, and then destroys the parameter holding the old state — one move plus a swap plus a destruction, where a dedicated move assignment could release the old state and steal the pointers directly.",
        "**The rule of thumb**: use copy-and-swap by default for resource-owning classes, because correctness is easy to get wrong and the idiom is correct by construction. Replace it with hand-written operators only when profiling shows the allocation matters — and then be very careful about self-assignment and ordering.",
        "**Best of all is not needing it.** A class whose members are all standard containers and smart pointers gets correct copy, move and assignment from the compiler, and this whole lesson becomes unnecessary. That is the rule of zero from module 5, and it remains the right target.",
      ],
      examples: [
        {
          id: "reuse",
          title: "The allocation copy-and-swap cannot avoid",
          lang: "cpp",
          code: `#include <cstdlib>
#include <iostream>
#include <vector>

static int allocations = 0;
void* operator new(std::size_t n) { ++allocations; return std::malloc(n); }
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

int main() {
    // std::vector deliberately does NOT use copy-and-swap: it reuses capacity.
    std::vector<int> a(1000, 1);
    std::vector<int> b(1000, 2);

    allocations = 0;
    a = b;                       // same size -- existing buffer is reused
    std::cout << "vector assign, same size      : "
              << allocations << " allocations\\n";

    std::vector<int> big(5000, 3);
    allocations = 0;
    a = big;                     // larger -- must grow
    std::cout << "vector assign, larger source  : "
              << allocations << " allocations\\n";

    allocations = 0;
    a = std::move(big);          // move assignment steals the buffer
    std::cout << "vector move-assign            : "
              << allocations << " allocations\\n";

    std::cout << "\\ncopy-and-swap would allocate in ALL THREE cases.\\n"
                 "That is why vector::operator= is hand-written and only\\n"
                 "offers the basic guarantee for range assignment.\\n";
}`,
          output: `vector assign, same size      : 0 allocations
vector assign, larger source  : 1 allocations
vector move-assign            : 0 allocations

copy-and-swap would allocate in ALL THREE cases.
That is why vector::operator= is hand-written and only
offers the basic guarantee for range assignment.`,
          explanation:
            "**Zero allocations for the same-size assignment** — `vector` reused the buffer it already had and copied 1000 ints into it. Copy-and-swap would have allocated a fresh 1000-element buffer, copied into that, swapped, and freed the original. This is the concrete trade the standard library made: it gave up the strong guarantee on range assignment to avoid an allocation on the common path, and documented the basic guarantee instead. Your own classes should usually make the opposite choice, unless you have measured.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the copy-and-swap idiom?",
      answer:
        "An assignment operator that takes its parameter **by value**, swaps the parameter's contents with `*this`, and lets the parameter's destructor release the old state. Taking by value is the trick: called with an lvalue the parameter is copy-constructed, called with an rvalue it is move-constructed, so one function serves both copy and move assignment using constructors you have already written and tested. The body is then just a `noexcept` swap and a `return *this`.",
    },
    {
      question: "What three properties does copy-and-swap give you?",
      answer:
        "Self-assignment safety with no check, because `a = a` copies into the parameter first and the swap is against an independent copy. The strong exception guarantee, because every allocation happens while constructing the parameter — before `*this` is touched — so a throw leaves the object completely unmodified, and the swap that follows cannot fail. And no duplicated logic, since one operator handles both copy and move assignment. It is the build-aside-then-commit shape of strong safety, packaged.",
    },
    {
      question: "Why must the `swap` be `noexcept`, and how should it be written?",
      answer:
        "Because it is the commit step: if it could throw, the operation could fail halfway through with the object in a mixed state, and the strong guarantee would be lost. Write it as a non-member `friend` so argument-dependent lookup can find it from generic code, mark it `noexcept`, and swap every member — forgetting one leaves the objects with mixed state, a bug that usually survives testing. Inside, write `using std::swap;` and then unqualified `swap(a.member_, b.member_)` so each member's own swap is used if it has one.",
    },
    {
      question: "What is the \"std two-step\" and why does it matter?",
      answer:
        "Writing `using std::swap;` to bring the generic version into scope as a fallback, then calling `swap(a, b)` *unqualified* so argument-dependent lookup can find a type-specific overload first. Writing `std::swap(a, b)` directly names one function and forces the generic three-move implementation, skipping any better overload the type provides — which for a type with a cheap specialised swap is a real performance loss and occasionally a correctness one. The same pattern applies to other customisation points like `begin` and `end`.",
    },
    {
      question: "Why does `std::vector` not use copy-and-swap for its assignment operator?",
      answer:
        "Because copy-and-swap always allocates. Assigning a 1000-element vector to another 1000-element vector would allocate a second buffer, copy, swap and free — where `vector::operator=` reuses the existing capacity when it is large enough and simply copies the elements, measurably zero allocations. The library traded the strong guarantee on range assignment for avoiding an allocation on the common path, and documents the basic guarantee instead. It is a deliberate, measured exception rather than an oversight.",
    },
    {
      question: "When would you not use copy-and-swap in your own class?",
      answer:
        "When profiling shows the unconditional allocation matters — a hot assignment path between same-sized objects that could reuse storage. Also note it makes move assignment marginally more expensive than a dedicated one, since it move-constructs the parameter, swaps, and then destroys the parameter holding the old state. Otherwise use it by default: correctness here is easy to get wrong and the idiom is correct by construction. Best of all is not needing it — a class whose members are containers and smart pointers gets correct assignment from the compiler, which is the rule of zero.",
    },
  ],
  takeaways: [
    "Copy-and-swap takes the parameter **by value**, swaps, and lets the parameter destroy the old state",
    "By-value means an lvalue is copy-constructed and an rvalue move-constructed — one operator serves both",
    "Self-assignment is safe with no check, because the copy happens before the swap",
    "It is strongly exception safe: all allocation precedes any modification, and the swap cannot fail",
    "The `swap` must be `noexcept` — it is the commit step",
    "Write `swap` as a non-member `friend` so ADL can find it from generic code",
    "`using std::swap;` then unqualified `swap(...)` — the std two-step",
    "Swap every member; a forgotten one leaves mixed state and survives most testing",
    "Copy-and-swap always allocates, which is why `vector::operator=` is hand-written",
    "`vector` assignment between same-sized vectors performs zero allocations",
    "Use it by default for resource-owning classes; replace it only after measuring",
    "Best of all is the rule of zero, where the compiler writes all of this for you",
  ],
  status: "available",
};
