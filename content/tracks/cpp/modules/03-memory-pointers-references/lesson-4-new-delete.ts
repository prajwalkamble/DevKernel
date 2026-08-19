import type { Lesson } from "@/content/types";

export const newDeleteLesson: Lesson = {
  id: "cpp-new-delete",
  slug: "dynamic-allocation",
  moduleSlug: "memory-pointers-references",
  title: "Dynamic Allocation: new, delete & the Ownership Question",
  summary:
    "How to allocate on the heap by hand, why `new[]` must be matched by `delete[]`, why `new` throws instead of returning null — and why, having learned all of it, you should almost never write it.",
  estimatedMinutes: 30,
  objectives: [
    "Allocate and free single objects and arrays correctly",
    "Match every `new` with `delete` and every `new[]` with `delete[]`",
    "Explain what `new` does beyond allocating memory",
    "Handle allocation failure, and know why `new` throws",
    "Answer the ownership question for every raw pointer you see",
  ],
  sections: [
    {
      id: "new-basics",
      heading: "new and delete",
      body: [
        "**`new T(args)`** does two things: it allocates enough memory for a `T`, then **runs `T`'s constructor** in that memory. It returns a `T*`. This is the crucial difference from C's `malloc`, which only allocates raw bytes and leaves an uninitialised region.",
        "**`delete p`** does the reverse, in reverse order: it **runs the destructor**, then releases the memory.",
        "**`new T[n]`** allocates an array and default-constructs each element; **`delete[] p`** destroys each element and frees the block.",
        "The initialisation rules mirror the ones from module 1: `new int` leaves the value indeterminate, `new int()` and `new int{}` zero it, and `new int(42)` sets it.",
      ],
      examples: [
        {
          id: "new-forms",
          title: "Every form, correctly paired",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

int main() {
    int* single = new int(42);          // one object, initialised
    int* zeroed = new int{};            // value-initialised to 0
    int* array  = new int[5]{1,2,3,4,5};

    std::cout << *single << ' ' << *zeroed << ' ' << array[2] << '\\n';

    delete single;                       // matches new
    delete zeroed;
    delete[] array;                      // matches new[]

    // Size known only at runtime — the reason new[] existed.
    std::size_t n = 3;
    double* buf = new double[n]{};
    buf[0] = 1.5;
    std::cout << buf[0] << ' ' << n << '\\n';
    delete[] buf;

    // Deleting nullptr is safe and does nothing.
    int* nothing = nullptr;
    delete nothing;
    std::cout << "delete nullptr: fine\\n";
}`,
          output: `42 0 3
1.5 3
delete nullptr: fine`,
          explanation:
            "**`delete nullptr;` being a no-op is genuinely useful** — it means a cleanup path does not need a null check, and it is why the `if (p) delete p;` you see in older code is redundant. Note the last block: allocating an array whose size is only known at runtime was, historically, the whole reason `new[]` existed. `std::vector` does it better in every respect.",
        },
      ],
      pitfalls: [
        {
          title: "`delete` after `new[]` is undefined behaviour, and the sanitizer names it exactly",
          body: "The two forms use different bookkeeping: `new[]` typically stores the element count so `delete[]` knows how many destructors to run. Calling plain `delete` on an array skips all but the first destructor and frees the block with the wrong deallocator. AddressSanitizer reports `alloc-dealloc-mismatch (operator new [] vs operator delete)`. The mismatch does not always crash, which is exactly why it survives in codebases — and why using containers, which cannot get this wrong, is the real fix.",
        },
      ],
    },
    {
      id: "allocation-failure",
      heading: "When allocation fails",
      body: [
        "**`new` does not return null on failure — it throws `std::bad_alloc`.** This surprises people coming from C, where `malloc` returns `NULL`.",
        "The reasoning is that a constructor has no other way to report failure, and silently returning a null pointer that nobody checks is worse than an exception nobody catches. An uncaught `std::bad_alloc` terminates the program with a clear message, which beats a null dereference somewhere unrelated.",
        "If you genuinely want the null-returning behaviour — a cache that should degrade rather than fail, or a codebase compiled without exceptions — use the `std::nothrow` form.",
        "In practice, on a modern desktop or server OS with overcommit, you will rarely see `bad_alloc` from a reasonable request: the kernel hands out address space optimistically and the process is killed by the OOM killer when it actually touches the pages. `bad_alloc` shows up reliably for absurd sizes, in constrained environments, and under a per-process memory limit.",
      ],
      examples: [
        {
          id: "bad-alloc",
          title: "Both failure modes",
          lang: "cpp",
          code: `#include <iostream>
#include <new>

int main() {
    try {
        // Ask for an absurd amount; new throws rather than returning null.
        std::size_t huge = static_cast<std::size_t>(-1) / 2;
        char* p = new char[huge];
        std::cout << "somehow succeeded\\n";
        delete[] p;
    } catch (const std::bad_alloc& e) {
        std::cout << "bad_alloc: " << e.what() << '\\n';
    }

    // The nothrow form returns nullptr instead of throwing.
    int* q = new (std::nothrow) int[1000];
    std::cout << "nothrow gave " << (q ? "a pointer" : "nullptr") << '\\n';
    delete[] q;
}`,
          output: `bad_alloc: std::bad_alloc
nothrow gave a pointer`,
          explanation:
            "`static_cast<std::size_t>(-1) / 2` is about 9 exabytes, which no allocator will satisfy. Note that **`e.what()` returned the type name rather than a helpful message** — `std::bad_alloc` carries no detail, because constructing a message would itself require allocating memory. That constraint is worth remembering: the one exception you most want diagnostics from is the one that cannot afford them.",
        },
      ],
    },
    {
      id: "ownership",
      heading: "The ownership question",
      body: [
        "This is the most important idea in the module, and it is not a language feature — it is a discipline the language expects you to supply.",
        "**Every heap allocation has an owner: the code responsible for destroying it.** A raw pointer does not say who that is. Given `Widget* w`, you cannot tell from the type whether you should delete it, whether someone else will, or whether it points into something you do not own at all.",
        "So for every raw pointer in a codebase, one of three answers must hold, and it must be documented somewhere if the type does not say it.",
        "**Owning** — this code must eventually `delete` it. Every path out of the function, including exceptions, must do so.",
        "**Non-owning (observing)** — someone else owns it; this code must not delete it, and must not use it after the owner does.",
        "**Nobody knows** — this is a bug, and it is how leaks and double-frees happen.",
        "The reason modern C++ has smart pointers is to move this answer **into the type**. `std::unique_ptr<Widget>` says \"I own this, solely\". `std::shared_ptr<Widget>` says \"ownership is shared\". A raw `Widget*` then means, by convention, \"observing, and I do not own this\" — which is a perfectly good use of a raw pointer.",
      ],
      examples: [
        {
          id: "ownership-unclear",
          title: "The same signature, three different contracts",
          lang: "cpp",
          code: `#include <string>

class Widget;

// What is the caller supposed to do with these? The types do not say.
Widget* create_widget();          // own it? delete it? which delete?
Widget* find_widget(int id);      // borrowed from a cache? do NOT delete?
void register_widget(Widget* w);  // does this take ownership of w?

// The same three, with the contract in the type instead of a comment.
std::unique_ptr<Widget> create_widget_v2();      // caller owns it
Widget* find_widget_v2(int id);                  // observing: do not delete
void register_widget_v2(std::unique_ptr<Widget>); // takes ownership
void inspect_widget_v2(const Widget& w);         // borrows, must exist`,
          explanation:
            "The second set needs no documentation. **`std::unique_ptr` as a return type means the caller owns it; as a by-value parameter it means the function takes ownership** — the caller must `std::move` into it, which makes the transfer visible at the call site. A raw pointer then reliably means \"observing\", and a reference means \"observing, and definitely not null\". Adopting this convention is the single highest-value habit in modern C++.",
        },
      ],
      pitfalls: [
        {
          title: "An early return or an exception between `new` and `delete` leaks",
          body: "This is why manual allocation is so error-prone: correctness requires *every* exit path to free, including the ones you did not write. An exception thrown by anything between the `new` and the `delete` unwinds straight past the cleanup. You cannot fix this with more care — you fix it by tying the deallocation to an object's destructor, which is what the next lessons and module 4 are about.",
        },
      ],
    },
    {
      id: "why-not",
      heading: "Why you should almost never write this",
      body: [
        "Having learned it: **manual `new` and `delete` should be rare to nonexistent in application code.** Not because they are hard to understand, but because being *correct* requires being right on every path, forever, including paths added by other people later.",
        "The replacements, in the order you should reach for them.",
        "**A local variable.** The default. No allocation at all.",
        "**A container.** `std::vector`, `std::string`, `std::map` — these are heap allocation with a destructor attached. `std::vector<int> v(n)` replaces `new int[n]` and cannot leak.",
        "**`std::make_unique<T>(args)`.** Sole ownership, freed automatically, zero overhead compared to a raw pointer. Replaces `new T(args)`.",
        "**`std::make_shared<T>(args)`.** Shared ownership, reference-counted. Use it when ownership is genuinely shared, not as a way of avoiding thinking about who owns what.",
        "The remaining legitimate uses of raw `new`: inside a container or allocator you are implementing, at the boundary with a C API that will call `free` itself, and in specific performance work such as a memory pool. **In all three, the `new` lives inside a class whose destructor does the `delete`** — which is RAII, and which module 4 builds properly.",
      ],
      examples: [
        {
          id: "replacements",
          title: "The same four jobs, before and after",
          lang: "cpp",
          code: `#include <iostream>
#include <memory>
#include <string>
#include <vector>

struct Widget {
    std::string name;
    explicit Widget(std::string n) : name(std::move(n)) {}
};

int main() {
    // 1. A dynamic array
    int* old_array = new int[100]{};
    delete[] old_array;
    std::vector<int> array(100);              // no delete to forget

    // 2. A single owned object
    Widget* old_widget = new Widget("gear");
    delete old_widget;
    auto widget = std::make_unique<Widget>("gear");

    // 3. A string built at runtime
    char* old_text = new char[6];
    std::snprintf(old_text, 6, "hello");
    delete[] old_text;
    std::string text = "hello";

    // 4. Shared ownership
    auto shared = std::make_shared<Widget>("shared");
    auto also = shared;                       // both keep it alive
    std::cout << array.size() << ' ' << widget->name << ' '
              << text << ' ' << also->name << ' '
              << shared.use_count() << '\\n';
}`,
          output: `100 gear hello shared 2`,
          explanation:
            "**Not one `delete` in the modern column, and not one way to leak.** `shared.use_count()` is 2 because two `shared_ptr`s refer to the same `Widget`; when both go out of scope the count reaches zero and the object is destroyed. Note that every modern version is also *shorter*, which is unusual for a safety improvement.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between `new` and `malloc`?",
      answer:
        "`malloc` allocates raw bytes and returns `void*`, leaving the memory uninitialised; you must cast it and construct anything yourself. `new` allocates *and* runs the constructor, returning a correctly typed pointer to a live object. On failure `malloc` returns null while `new` throws `std::bad_alloc`. They must also be paired correctly with `free` and `delete` respectively — mixing them is undefined behaviour, since `delete` calls a destructor that `malloc`'s memory never had constructed.",
    },
    {
      question: "Why must `new[]` be matched with `delete[]`?",
      answer:
        "Because the array form has to destroy every element, not just the first, and it typically relies on an element count stored alongside the allocation. Plain `delete` on an array runs one destructor and hands the block to the wrong deallocator, which is undefined behaviour — AddressSanitizer reports it as `alloc-dealloc-mismatch (operator new [] vs operator delete)`. It frequently does not crash, which is why it survives in real code. Using `std::vector` removes the possibility entirely.",
    },
    {
      question: "What happens when `new` cannot allocate?",
      answer:
        "It throws `std::bad_alloc` rather than returning null, because a constructor has no other channel to report failure and a silently null pointer is worse than an uncaught exception. The `new (std::nothrow)` form returns null instead, for code compiled without exceptions or where degrading is preferable to failing. Note that `std::bad_alloc` carries no message — `what()` just returns the type name — because building one would itself require an allocation.",
    },
    {
      question: "What does it mean for a pointer to \"own\" something?",
      answer:
        "That the code holding it is responsible for destroying the pointee, on every exit path including exceptions. A raw pointer does not encode this: given a `Widget*` you cannot tell whether to delete it, whether someone else will, or whether it points into something you do not own. Modern C++ moves the answer into the type — `std::unique_ptr` for sole ownership, `std::shared_ptr` for shared — leaving raw pointers to mean \"observing, not owning\" by convention. That convention is what makes ownership readable from a signature instead of a comment.",
    },
    {
      question: "When is it legitimate to write `new` and `delete` today?",
      answer:
        "Implementing a container or custom allocator; interoperating with a C API that will take ownership and call `free` or its own deleter; and specific performance work such as a memory pool or arena. In all of them the `new` belongs inside a class whose destructor performs the matching `delete`, so the pairing is guaranteed by the object's lifetime rather than by remembering. In ordinary application code, a local, a container, or `std::make_unique` covers essentially every case — and each is shorter than the manual version.",
    },
  ],
  takeaways: [
    "`new` allocates *and* constructs; `delete` destructs *and* frees — that is the difference from `malloc`/`free`",
    "Match `new` with `delete` and `new[]` with `delete[]`; mismatching is undefined and often does not crash",
    "`delete nullptr;` is a safe no-op, so cleanup paths need no null check",
    "`new` throws `std::bad_alloc` rather than returning null; `new (std::nothrow)` opts into the null behaviour",
    "`std::bad_alloc` carries no message, because building one would need to allocate",
    "Every heap allocation needs an owner, and a raw pointer does not say who that is",
    "`unique_ptr` return means the caller owns it; a by-value `unique_ptr` parameter means the function takes it",
    "An exception or early return between `new` and `delete` leaks — which is why deallocation belongs in a destructor",
  ],
  status: "available",
};
