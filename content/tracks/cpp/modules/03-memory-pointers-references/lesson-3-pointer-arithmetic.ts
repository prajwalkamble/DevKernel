import type { Lesson } from "@/content/types";

export const pointerArithmeticLesson: Lesson = {
  id: "cpp-pointer-arithmetic",
  slug: "pointer-arithmetic-and-arrays",
  moduleSlug: "memory-pointers-references",
  title: "Pointer Arithmetic, Arrays & Decay",
  summary:
    "Why `p + 1` moves four bytes for an `int` and eight for a `double`, why `arr[i]` is literally `*(arr + i)` — and therefore why `3[arr]` compiles — and why raw arrays lose their size the moment you pass them anywhere.",
  estimatedMinutes: 30,
  objectives: [
    "Explain what adding an integer to a pointer actually does",
    "Show that indexing is defined in terms of pointer arithmetic",
    "Explain array-to-pointer decay and what is lost",
    "Use the half-open `begin`/`end` convention the standard library is built on",
    "Replace raw arrays with `std::array`, `std::vector` and `std::span`",
  ],
  sections: [
    {
      id: "arithmetic",
      heading: "Adding to a pointer moves by elements, not bytes",
      body: [
        "`p + 1` does not add one to the address. It advances by **`sizeof(*p)` bytes** — one element of whatever `p` points at.",
        "This is why the pointer's type matters even though every pointer is the same size. For an `int*` on a typical machine, `p + 1` is 4 bytes further on. For a `double*` it is 8. The compiler does the multiplication for you.",
        "Subtracting two pointers into the same array gives the number of **elements** between them, as a signed `std::ptrdiff_t` — again, not bytes.",
        "The operations defined on pointers are: add or subtract an integer, subtract two pointers, compare two pointers, and increment or decrement. Multiplying two pointers is meaningless and does not compile.",
      ],
      examples: [
        {
          id: "arithmetic-demo",
          title: "The step size, and the identity behind indexing",
          lang: "cpp",
          code: `#include <iostream>

int main() {
    int arr[5]{10, 20, 30, 40, 50};
    int* p = arr;                       // decays to &arr[0]

    std::cout << "p    -> " << *p       << '\\n';
    std::cout << "p+1  -> " << *(p + 1) << '\\n';
    std::cout << "p[2] -> " << p[2]     << '\\n';

    std::cout << "addresses step by " << (char*)(p + 1) - (char*)p << " bytes\\n";

    double d[3]{};
    double* q = d;
    std::cout << "double steps by  " << (char*)(q + 1) - (char*)q << " bytes\\n";

    std::cout << "arr[3] == *(arr+3) == 3[arr] : "
              << arr[3] << ' ' << *(arr + 3) << ' ' << 3[arr] << '\\n';

    std::cout << "end - begin = " << (arr + 5) - arr << " elements\\n";
}`,
          output: `p    -> 10
p+1  -> 20
p[2] -> 30
addresses step by 4 bytes
double steps by  8 bytes
arr[3] == *(arr+3) == 3[arr] : 40 40 40
end - begin = 5 elements`,
          explanation:
            "**The line worth staring at is `3[arr]`.** The standard defines `a[b]` as `*(a + b)`, and addition is commutative, so `3[arr]` is `*(3 + arr)` — identical to `arr[3]`. It compiles, it works, and you must never write it. It is here because it proves the point: **indexing is not a primitive operation in C++, it is pointer arithmetic with nicer syntax.** The `(char*)` casts are how you see the raw byte distance, since `char` is 1 byte by definition.",
        },
      ],
      pitfalls: [
        {
          title: "Going out of bounds is undefined even if you never dereference",
          body: "The standard permits a pointer to point at any element of an array *or one past the last element*, and nothing else. `arr + 5` for a five-element array is legal (that is the `end` iterator) but `*(arr + 5)` is not, and `arr + 6` is undefined behaviour even if you never dereference it. In practice you will get away with it constantly, right up until the optimiser uses the assumption that it cannot happen. AddressSanitizer reports the dereference; the bare arithmetic usually goes unnoticed.",
        },
      ],
    },
    {
      id: "half-open",
      heading: "The half-open range",
      body: [
        "The standard library represents every range as a pair `[begin, end)` — `begin` points at the first element, `end` points **one past the last**. This convention is worth understanding rather than memorising, because it is everywhere.",
        "Three properties make it the right choice. **The size is `end - begin`**, with no off-by-one. **An empty range is `begin == end`**, which needs no special case. **Ranges split cleanly**: `[a, b)` and `[b, c)` partition `[a, c)` with no element counted twice and none missed.",
        "This is why `v.end()` does not point at a valid element and dereferencing it is undefined behaviour — it is a boundary marker, not a position.",
      ],
      examples: [
        {
          id: "half-open-demo",
          title: "Walking a range the way the library does",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    int arr[5]{10, 20, 30, 40, 50};

    // Raw pointers ARE iterators for an array.
    for (int* it = arr; it != arr + 5; ++it) std::cout << *it << ' ';
    std::cout << '\\n';

    // The same shape with a container.
    std::vector<int> v{1, 2, 3, 4};
    for (auto it = v.begin(); it != v.end(); ++it) std::cout << *it << ' ';
    std::cout << '\\n';

    // Which is why standard algorithms accept raw pointers unchanged.
    std::cout << "sum: " << std::accumulate(arr, arr + 5, 0) << '\\n';

    // Empty range needs no special case.
    std::vector<int> empty;
    std::cout << "empty? " << std::boolalpha
              << (empty.begin() == empty.end()) << '\\n';
}`,
          output: `10 20 30 40 50
1 2 3 4
sum: 150
empty? true`,
          explanation:
            "**Note `it != end` rather than `it < end`.** Both work for arrays and vectors, but `!=` is the form that works for every iterator category — a linked list's iterators have no ordering, so `<` would not compile. Writing `!=` from the start means your loops keep working when the container changes. And notice that `std::accumulate(arr, arr + 5, 0)` takes raw pointers: **a pointer satisfies every requirement of a random-access iterator**, which is not a coincidence but the design.",
        },
      ],
    },
    {
      id: "decay",
      heading: "Array decay",
      body: [
        "In nearly every context, an array's name converts automatically to a pointer to its first element. This is **array-to-pointer decay**, and it is inherited from C.",
        "It is why `int* p = arr;` compiles with no cast, and why passing an array to a function passes a pointer.",
        "**What is lost is the length.** The type `int[5]` carries the size; the type `int*` does not. Once decayed, there is no way to recover it, which is the root cause of a very large fraction of C and C++ buffer overruns.",
        "There are exactly three contexts where an array does **not** decay: as the operand of `sizeof`, as the operand of `&` (giving `int(*)[5]`, a pointer to the whole array), and when binding to a reference to array (`int(&)[5]`). That last one is the basis of the trick below.",
      ],
      examples: [
        {
          id: "decay-demo",
          title: "The size surviving, and not surviving",
          lang: "cpp",
          code: `#include <iostream>
#include <array>
#include <span>

void takes_pointer(int* p) {
    std::cout << "  pointer:      " << sizeof(p) << " bytes (the pointer)\\n";
}

// A reference to an array: the size is part of the type and survives.
template <std::size_t N>
void takes_array_ref(int (&a)[N]) {
    std::cout << "  array ref:    " << N << " elements\\n";
}

void takes_span(std::span<const int> s) {
    std::cout << "  span:         " << s.size() << " elements\\n";
}

int main() {
    int arr[5]{1, 2, 3, 4, 5};
    std::cout << "at the definition: " << sizeof(arr) << " bytes, "
              << sizeof(arr) / sizeof(arr[0]) << " elements\\n";

    takes_pointer(arr);
    takes_array_ref(arr);
    takes_span(arr);

    std::array<int, 5> modern{1, 2, 3, 4, 5};
    std::cout << "std::array:      " << modern.size() << " elements\\n";
}`,
          output: `at the definition: 20 bytes, 5 elements
  pointer:      8 bytes (the pointer)
  array ref:    5 elements
  span:         5 elements
std::array:      5 elements`,
          explanation:
            "`sizeof(arr) / sizeof(arr[0])` is the classic C idiom for an array's length, and it works **only** in the scope where the array was declared — one function call later it silently computes `8 / 4 = 2`. The array-reference template preserves `N`, which is how `std::size()` and `std::begin()` work for raw arrays. **In new code, skip all of this**: `std::array` when the size is fixed, `std::vector` when it varies, `std::span` to pass either one without copying.",
        },
      ],
      pitfalls: [
        {
          title: "`sizeof(arr) / sizeof(arr[0])` inside a function is always wrong",
          body: "It is the single most common array bug in C-style C++. Because the parameter is a pointer, `sizeof(arr)` is the pointer size — typically 8 — and `sizeof(arr[0])` is the element size, so a function receiving an `int*` computes 2 regardless of the real length. GCC warns with `-Wsizeof-pointer-div`, and it is one of the more valuable warnings to have on. The fix is to take a `std::span`, which carries the length.",
        },
      ],
    },
    {
      id: "modern",
      heading: "What to use instead",
      body: [
        "Raw arrays and pointer arithmetic are worth understanding because they are what everything else is built on, and because you will read code that uses them. They are rarely the right thing to *write*.",
        "**`std::array<T, N>`** — a fixed-size array that knows its own size, passes by value like a struct, and has `begin`/`end`/`size`. Zero overhead compared to `T[N]`.",
        "**`std::vector<T>`** — when the size varies or is only known at runtime. Manages its own heap memory, so there is no `delete` to forget.",
        "**`std::span<T>`** (C++20) — a non-owning view: a pointer plus a length. This is what a function should take when it wants to read or modify a contiguous range without caring whether it came from an array, a vector or a `std::array`. Passing one costs the same as passing a pointer, and the length comes along.",
        "**`std::string_view`** — the same idea for text, covered in module 8.",
        "One habit worth adopting now: **when you write a function that takes a pointer and a length, take a `std::span` instead.** It is the same information with the two halves impossible to separate.",
      ],
      examples: [
        {
          id: "span-replacement",
          title: "The signature upgrade",
          lang: "cpp",
          code: `#include <iostream>
#include <span>
#include <vector>
#include <array>
#include <numeric>

// Before: two parameters that must be kept consistent by hand.
int sum_old(const int* data, std::size_t count) {
    int total = 0;
    for (std::size_t i = 0; i < count; ++i) total += data[i];
    return total;
}

// After: one parameter, impossible to mismatch.
int sum_new(std::span<const int> data) {
    return std::accumulate(data.begin(), data.end(), 0);
}

int main() {
    int raw[4]{1, 2, 3, 4};
    std::vector<int> vec{1, 2, 3, 4, 5};
    std::array<int, 3> arr{10, 20, 30};

    std::cout << sum_old(raw, 4) << '\\n';
    std::cout << sum_new(raw) << ' ' << sum_new(vec) << ' ' << sum_new(arr) << '\\n';

    // A span can also view part of a range.
    std::cout << sum_new(std::span{vec}.subspan(1, 3)) << '\\n';
}`,
          output: `10
10 15 60
9`,
          explanation:
            "**One function, three container types, no conversions and no copies.** The old signature works too, until someone passes the wrong count — and nothing in the type system stops them. `subspan(1, 3)` views elements 1 through 3 of the vector (2, 3, 4), summing to 9, without copying anything. Use `std::span<const T>` for read-only access and `std::span<T>` when the function modifies the elements.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does `p + 1` do for a pointer?",
      answer:
        "It advances the address by `sizeof(*p)` bytes — one element, not one byte. So for an `int*` it moves 4 bytes on a typical machine and for a `double*` 8. Subtracting two pointers into the same array yields the number of elements between them as a signed `std::ptrdiff_t`, again not bytes. This is the only reason the pointed-to type matters for arithmetic, since all pointers are the same size.",
    },
    {
      question: "Why does `3[arr]` compile?",
      answer:
        "Because the standard defines `a[b]` as `*(a + b)`, and addition is commutative, so `3[arr]` is `*(3 + arr)` — identical to `arr[3]`. It is a curiosity rather than something to write, but it demonstrates the real point: indexing is not a primitive operation in C++, it is pointer arithmetic with friendlier syntax. That is also why raw pointers work directly with standard algorithms.",
    },
    {
      question: "What is array decay and what does it cost?",
      answer:
        "An array's name converts automatically to a pointer to its first element in almost every context. The cost is that the length, which is part of the type `int[5]`, is not part of `int*` and cannot be recovered. That is the root cause of a large share of buffer overruns. The three contexts where decay does not happen are `sizeof`, `&`, and binding to a reference-to-array — the last of which is how `std::size()` works for raw arrays.",
    },
    {
      question: "Why is `sizeof(arr) / sizeof(arr[0])` unreliable?",
      answer:
        "It only works in the scope where the array was declared. Passed to a function the array has decayed to a pointer, so `sizeof(arr)` is the pointer size — 8 — and the expression silently computes 2 for an `int*` regardless of the real length. GCC's `-Wsizeof-pointer-div` catches it. The fix is to pass a `std::span`, which carries the length as part of the value.",
    },
    {
      question: "Why does the standard library use half-open ranges?",
      answer:
        "Because `[begin, end)` makes three things fall out for free: the size is exactly `end - begin` with no off-by-one, an empty range is simply `begin == end` requiring no special case, and adjacent ranges partition cleanly with nothing double-counted. It is also why `end()` does not point at an element and dereferencing it is undefined — it is a boundary marker. Loops should use `it != end` rather than `it < end`, since ordering comparisons are not available on all iterator categories.",
    },
  ],
  takeaways: [
    "`p + 1` moves by one element — `sizeof(*p)` bytes — and pointer subtraction yields elements, not bytes",
    "`a[b]` is defined as `*(a + b)`, which is why `3[arr]` compiles and why pointers work as iterators",
    "A pointer may address any element or one past the end; anything further is undefined even without dereferencing",
    "`[begin, end)` gives size, emptiness and partitioning with no special cases — and `end()` is not dereferenceable",
    "Prefer `it != end` to `it < end`, so the loop still compiles for non-random-access iterators",
    "Array decay loses the length permanently; `sizeof(arr)/sizeof(arr[0])` is wrong in any function that received it",
    "Use `std::array` for fixed sizes, `std::vector` for variable ones, and `std::span` to pass either without copying",
    "Any signature taking a pointer and a length should take a `std::span` instead",
  ],
  status: "available",
};
