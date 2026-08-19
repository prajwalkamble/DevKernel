import type { Lesson } from "@/content/types";

export const vectorLesson: Lesson = {
  id: "cpp-vector",
  slug: "vector-growth-and-reallocation",
  moduleSlug: "standard-library",
  title: "vector: Growth, Capacity, reserve & the Reallocation You Did Not See",
  summary:
    "The container you should reach for by default, and the one operation that quietly invalidates every pointer into it. Size against capacity, why growth is geometric, what `reserve` actually buys, and the difference between `push_back` and `emplace_back` measured.",
  estimatedMinutes: 35,
  objectives: [
    "Distinguish size from capacity and predict when a reallocation happens",
    "Explain why growth is geometric rather than incremental",
    "Use `reserve` correctly, and say when it does nothing useful",
    "List exactly what a reallocation invalidates",
    "Choose between `push_back` and `emplace_back` for a reason",
  ],
  sections: [
    {
      id: "size-vs-capacity",
      heading: "Size, capacity and geometric growth",
      body: [
        "`std::vector` stores its elements in **one contiguous block**, which is why indexing is a single addition and why iterating it is as fast as iterating a raw array. Everything else about it follows from having to keep that promise while growing.",
        "**Size is how many elements exist. Capacity is how many fit before the block must be replaced.** They are different numbers and only the first is about your data.",
        "When a `push_back` would exceed capacity, the vector allocates a **new, larger block**, moves or copies every existing element into it, destroys the originals, and frees the old block. That is a reallocation, and it is O(n).",
        "**The growth is geometric — libstdc++ doubles** — and that is what makes `push_back` amortised O(1) rather than O(n). Doubling means n pushes trigger about log₂(n) reallocations moving 1 + 2 + 4 + … + n ≈ 2n elements in total, so the cost *per push* averages to a constant. Growing by a fixed amount instead would make n pushes cost O(n²).",
        "The factor is not specified by the standard. libstdc++ and libc++ use 2; MSVC uses 1.5, which wastes less memory and lets earlier blocks be reused.",
      ],
      examples: [
        {
          id: "growth",
          title: "Watching the capacity double",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v;
    std::size_t lastCap = 0;

    std::cout << "growth as elements are pushed:\\n";
    for (int i = 0; i < 20; ++i) {
        v.push_back(i);
        if (v.capacity() != lastCap) {
            std::cout << "  size " << v.size()
                      << " -> capacity " << v.capacity()
                      << "  (reallocated)\\n";
            lastCap = v.capacity();
        }
    }

    // reserve avoids every reallocation if you know the final size.
    std::vector<int> r;
    r.reserve(20);
    std::cout << "after reserve(20): capacity = " << r.capacity() << '\\n';
    lastCap = r.capacity();
    int reallocs = 0;
    for (int i = 0; i < 20; ++i) {
        r.push_back(i);
        if (r.capacity() != lastCap) { ++reallocs; lastCap = r.capacity(); }
    }
    std::cout << "reallocations during 20 pushes: " << reallocs << '\\n';

    // size and capacity are different things.
    std::cout << "v.size() = " << v.size()
              << ", v.capacity() = " << v.capacity() << '\\n';
    v.clear();
    std::cout << "after clear(): size = " << v.size()
              << ", capacity = " << v.capacity() << "  (memory kept)\\n";
    v.shrink_to_fit();
    std::cout << "after shrink_to_fit(): capacity = " << v.capacity() << '\\n';
}`,
          output: `growth as elements are pushed:
  size 1 -> capacity 1  (reallocated)
  size 2 -> capacity 2  (reallocated)
  size 3 -> capacity 4  (reallocated)
  size 5 -> capacity 8  (reallocated)
  size 9 -> capacity 16  (reallocated)
  size 17 -> capacity 32  (reallocated)
after reserve(20): capacity = 20
reallocations during 20 pushes: 0
v.size() = 20, v.capacity() = 32
after clear(): size = 0, capacity = 32  (memory kept)
after shrink_to_fit(): capacity = 0`,
          explanation:
            "**Six reallocations for 20 pushes, and zero after `reserve(20)`.** The capacities go 1, 2, 4, 8, 16, 32 — exact doubling on libstdc++. Two other facts worth keeping: `size()` is 20 while `capacity()` is 32, so a third of the block is unused; and **`clear()` destroys the elements but keeps the memory**, which is usually what you want for a buffer you are about to refill and occasionally a leak-shaped surprise. `shrink_to_fit()` is a non-binding request to release it — here it went to 0 because the vector was empty.",
        },
      ],
      pitfalls: [
        {
          title: "`reserve` is not `resize`, and the wrong one is a common bug",
          body: "`reserve(n)` changes capacity only — size stays the same, no elements are created, and `v[0]` after `reserve(10)` on an empty vector is undefined behaviour. `resize(n)` changes the *size*, value-initialising new elements, so `v[0]` is then valid and zero. The bug is calling `reserve` and then writing through `operator[]`: it usually appears to work, because the memory is allocated, and it is undefined behaviour that a sanitizer will flag. If you want n usable elements, use `resize`; if you want to avoid reallocations while pushing, use `reserve`.",
        },
      ],
    },
    {
      id: "invalidation",
      heading: "What a reallocation destroys",
      body: [
        "The elements survive a reallocation — they are moved to the new block. **Everything that referred to their old addresses does not.**",
        "**A reallocation invalidates all iterators, all pointers and all references into the vector.** Not just the ones near the end; all of them, because the entire block moved.",
        "This is the single most common source of undefined behaviour with `vector`, and it is nasty precisely because it is intermittent: the code works while there is spare capacity and breaks on the push that happens to exceed it. A test with three elements passes; production with three hundred does not.",
        "The rules are worth stating exactly. **`push_back`, `emplace_back`, `insert` and `resize` invalidate everything if they cause a reallocation**, and if they do not, `insert` and `erase` still invalidate everything at or after the modified position. **`erase` invalidates from the erased element onwards.** `clear` invalidates everything. `reserve` invalidates everything if it actually grows the buffer.",
        "The defence is not to memorise the table but to adopt the habit: **do not hold a pointer, reference or iterator into a vector across any operation that might modify it.** Store an index instead — indices survive reallocation — or re-acquire afterwards.",
      ],
      examples: [
        {
          id: "dangling",
          title: "The push that invalidates everything",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3};
    v.reserve(4);                 // capacity 4, size 3 -- one push left

    int&  ref = v[0];             // reference into the buffer
    int*  ptr = v.data();
    auto  it  = v.begin();

    std::cout << "capacity " << v.capacity() << ", size " << v.size() << '\\n';
    std::cout << "before: ref = " << ref << ", *ptr = " << *ptr
              << ", *it = " << *it << '\\n';

    v.push_back(4);               // fits: capacity 4, no reallocation
    std::cout << "after push_back(4) [no realloc]: ref = " << ref << '\\n';

    v.push_back(5);               // EXCEEDS capacity -> reallocation
    std::cout << "capacity is now " << v.capacity() << '\\n';
    std::cout << "ref, ptr and it are ALL DANGLING now.\\n";

    // Reading through them is undefined behaviour. Re-acquire instead:
    int& freshRef = v[0];
    std::cout << "re-acquired: v[0] = " << freshRef << '\\n';
}`,
          output: `capacity 4, size 3
before: ref = 1, *ptr = 1, *it = 1
after push_back(4) [no realloc]: ref = 1
capacity is now 8
ref, ptr and it are ALL DANGLING now.
re-acquired: v[0] = 1`,
          explanation:
            "**The first `push_back` was harmless and the second was catastrophic**, and nothing in the source distinguishes them — the difference is whether the capacity happened to be exhausted. That is what makes this bug so hard to catch by reading: `ref` was fine on one line and dangling on the next. Note that `ref` referred to element 0, nowhere near the insertion point, and it died anyway. Build with `-fsanitize=address` and the read through a stale reference is reported immediately as a heap-use-after-free.",
        },
      ],
    },
    {
      id: "push-vs-emplace",
      heading: "push_back against emplace_back",
      body: [
        "`push_back` takes an object and puts a copy or a move of it into the vector. **`emplace_back` takes the constructor's arguments and builds the element directly in the vector's storage**, using the perfect forwarding from module 7.",
        "So `v.emplace_back(\"b\")` constructs one object. `v.push_back(Loud{\"a\"})` constructs a temporary and then moves it in — one extra move, or an extra *copy* if the type is not movable.",
        "**The saving is real but usually small**, since a move is cheap for well-written types. Prefer `emplace_back` where it reads naturally, and do not contort code for it.",
        "**Two cases where `push_back` is the better choice.** When you already have an object, `push_back(existing)` says \"add this\" more clearly than `emplace_back(existing)`, which merely happens to select the copy constructor. And `emplace_back` uses *direct* initialisation, so it will happily call an `explicit` constructor that `push_back` would reject — `std::vector<std::unique_ptr<T>> v; v.emplace_back(rawPtr);` compiles and silently takes ownership of a raw pointer, where `push_back` refuses. That safety is worth something.",
        "**Both invalidate on reallocation**, and neither is a substitute for `reserve` when you know the size in advance.",
      ],
      examples: [
        {
          id: "emplace",
          title: "Counting the constructions",
          lang: "cpp",
          code: `#include <iostream>
#include <string>
#include <vector>

struct Loud {
    std::string name;
    explicit Loud(std::string n) : name(std::move(n)) {
        std::cout << "    ctor  " << name << '\\n';
    }
    Loud(const Loud& o) : name(o.name) {
        std::cout << "    COPY  " << name << '\\n';
    }
    Loud(Loud&& o) noexcept : name(std::move(o.name)) {
        std::cout << "    move  " << name << '\\n';
    }
};

int main() {
    std::cout << "push_back(Loud{...}) -- constructs a temporary, then moves:\\n";
    {
        std::vector<Loud> v;
        v.reserve(4);
        v.push_back(Loud{"a"});
    }

    std::cout << "emplace_back(...)    -- constructs IN PLACE, no temporary:\\n";
    {
        std::vector<Loud> v;
        v.reserve(4);
        v.emplace_back("b");
    }

    std::cout << "growth without reserve moves every existing element:\\n";
    {
        std::vector<Loud> v;
        v.emplace_back("x");
        std::cout << "  -- now pushing y, which forces a reallocation:\\n";
        v.emplace_back("y");
    }
}`,
          output: `push_back(Loud{...}) -- constructs a temporary, then moves:
    ctor  a
    move  a
emplace_back(...)    -- constructs IN PLACE, no temporary:
    ctor  b
growth without reserve moves every existing element:
    ctor  x
  -- now pushing y, which forces a reallocation:
    ctor  y
    move  x`,
          explanation:
            "**Two operations for `push_back`, one for `emplace_back`.** The third block shows the reallocation cost directly: pushing `y` constructed it and then *moved* `x` into the new buffer — with a hundred existing elements that would be a hundred moves. Note that it **moved** rather than copied, which is only true because `Loud`'s move constructor is marked `noexcept`; module 10 shows what `vector` does when it is not, and why that one keyword changes the cost of growth.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between a vector's size and its capacity?",
      answer:
        "Size is the number of elements that exist; capacity is how many the currently allocated block can hold before it must be replaced. Only size is about your data. When a `push_back` would exceed capacity the vector allocates a bigger block, moves or copies every element across, destroys the originals and frees the old block — an O(n) reallocation. `clear()` sets size to zero but leaves capacity untouched, so the memory is retained; `shrink_to_fit()` is a non-binding request to release it.",
    },
    {
      question: "Why does vector grow geometrically rather than by a fixed amount?",
      answer:
        "To make `push_back` amortised O(1). Doubling means n pushes trigger about log₂(n) reallocations, moving 1 + 2 + 4 + … + n ≈ 2n elements in total, so the cost per push averages to a constant. Growing by a fixed increment would trigger a reallocation every k pushes and move O(n) elements each time, making n pushes O(n²). The factor is not specified by the standard: libstdc++ and libc++ double, MSVC uses 1.5, which wastes less memory and allows earlier freed blocks to be reused.",
    },
    {
      question: "What does a reallocation invalidate?",
      answer:
        "All iterators, all pointers and all references into the vector — not just those near the modification point, because the entire block moved to a new address. That makes it the most common source of undefined behaviour with vectors, and an intermittent one: the code works while spare capacity remains and breaks on the push that exceeds it, so small tests pass and production fails. The habit that prevents it is never holding a pointer, reference or iterator across an operation that may modify the vector — store an index instead, since indices survive reallocation, or re-acquire afterwards.",
    },
    {
      question: "When does `insert` or `erase` invalidate iterators without reallocating?",
      answer:
        "`erase` invalidates iterators, pointers and references from the erased element onwards, because the following elements shift down. `insert` without reallocation invalidates everything at or after the insertion point for the same reason. If `insert` does cause a reallocation, everything is invalidated. `reserve` invalidates everything if it actually grows the buffer and nothing if the capacity was already sufficient. The safe summary is that any modifying operation may invalidate, and only the exact position rules differ.",
    },
    {
      question: "What is the difference between `push_back` and `emplace_back`, and when is `push_back` better?",
      answer:
        "`push_back` takes an object and copies or moves it in; `emplace_back` takes the constructor's arguments and builds the element directly in the vector's storage through perfect forwarding, saving one move. The saving is usually small since moves are cheap. `push_back` is better in two cases: when you already have an object, where it states the intent more clearly; and for safety, because `emplace_back` uses direct initialisation and will call an `explicit` constructor that `push_back` rejects — `emplace_back(rawPtr)` on a `vector<unique_ptr<T>>` compiles and silently takes ownership, which `push_back` would refuse.",
    },
    {
      question: "What is the difference between `reserve` and `resize`?",
      answer:
        "`reserve(n)` changes capacity only: no elements are created, size is unchanged, and accessing `v[0]` after reserving on an empty vector is undefined behaviour even though the memory exists. `resize(n)` changes the size, value-initialising any new elements, so those indices become valid. The classic bug is calling `reserve` and then writing through `operator[]`, which appears to work because the memory is allocated and is undefined behaviour a sanitizer will catch. Use `resize` when you want n usable elements, `reserve` when you want to avoid reallocation while pushing.",
    },
  ],
  takeaways: [
    "A vector's elements are one contiguous block, which is why indexing and iteration are fast",
    "Size is how many elements exist; capacity is how many fit before the block is replaced",
    "Growth is geometric — libstdc++ doubles — which is what makes `push_back` amortised O(1)",
    "The growth factor is unspecified: 2 on libstdc++ and libc++, 1.5 on MSVC",
    "A reallocation invalidates every iterator, pointer and reference into the vector",
    "The bug is intermittent — it appears only on the push that exhausts capacity",
    "Store indices rather than pointers if you must refer to elements across a modification",
    "`clear()` destroys elements but keeps the memory; `shrink_to_fit()` requests its release",
    "`reserve` changes capacity only — writing through `operator[]` afterwards is undefined behaviour",
    "`emplace_back` constructs in place and saves a move; `push_back` refuses `explicit` conversions",
    "Reallocation moves rather than copies only when the move constructor is `noexcept`",
  ],
  status: "available",
};
