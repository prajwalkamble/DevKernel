import type { Lesson } from "@/content/types";

export const memoryModelLesson: Lesson = {
  id: "cpp-memory-model",
  slug: "the-memory-model",
  moduleSlug: "memory-pointers-references",
  title: "Where Objects Live: Stack, Heap & Static Storage",
  summary:
    "The map of a running C++ program's memory, printed out by the program itself: which region each kind of variable lands in, why the stack is fast and small, why the heap is slow and large, and how to choose.",
  estimatedMinutes: 30,
  objectives: [
    "Name the memory regions and say which variables live in each",
    "Print the actual addresses and read the layout from them",
    "Explain why stack allocation is nearly free and heap allocation is not",
    "Recognise stack overflow and know what causes it",
    "Choose between stack and heap for a given object",
  ],
  sections: [
    {
      id: "regions",
      heading: "The four regions",
      body: [
        "A running program's address space is divided into regions with genuinely different properties. The standard does not mandate this layout — it speaks only of storage durations — but every mainstream implementation works this way, and knowing it makes a great deal of C++ behaviour obvious.",
        "**The code segment (`.text`)** holds the machine instructions. Read-only and executable, so overwriting your own program is a crash rather than a security hole.",
        "**Static storage (`.data` and `.bss`)** holds globals, namespace-scope variables, `static` locals and `static` members. Fixed size, decided at compile time, existing for the whole run. `.data` holds initialised values; `.bss` holds the zero-initialised ones and takes no space in the executable file — it is just a size the loader zeroes. String literals live in a read-only section nearby.",
        "**The heap (free store)** is where `new` allocates. Large — limited by available RAM — and managed at runtime by the allocator. It grows upward, toward the stack.",
        "**The stack** holds function parameters, local variables and return addresses, one frame per active call. Small and fixed: typically **8 MB on Linux, 1 MB on Windows**, per thread. It grows downward, toward the heap.",
      ],
      examples: [
        {
          id: "address-map",
          title: "The program printing its own memory map",
          lang: "cpp",
          code: `#include <iostream>
#include <string>

int global_value = 1;                 // static storage
const char* literal = "read-only";    // literal in a read-only section

void where_am_i() {
    int local = 2;                    // stack
    static int persistent = 3;        // static storage
    int* heap = new int(4);           // the object on the heap, the pointer on the stack

    std::cout << "global:     " << (void*)&global_value << '\\n';
    std::cout << "literal:    " << (void*)literal       << '\\n';
    std::cout << "persistent: " << (void*)&persistent   << '\\n';
    std::cout << "local:      " << (void*)&local        << '\\n';
    std::cout << "heap obj:   " << (void*)heap          << '\\n';
    std::cout << "heap ptr:   " << (void*)&heap         << '\\n';
    delete heap;
}

int main() { where_am_i(); }`,
          output: `global:     0x5560ba0a0038
literal:    0x5560ba09e004
persistent: 0x5560ba0a003c
local:      0x7ffd06b48efc
heap obj:   0x5560c1a6b2b0
heap ptr:   0x7ffd06b48ef0`,
          explanation:
            "Three clusters, and the gap between them is enormous. **The statics and the literal sit together around `0x5560ba09…`** — the same region, loaded from the executable. **The heap object is at `0x5560c1…`**, higher than the statics but in the same broad area. **The locals are at `0x7ffd…`**, about 47 *terabytes* of address space away. That gap is deliberate: the stack grows down from the top and the heap grows up from the bottom, so both have room to expand. The `(void*)` cast is needed because `std::cout` would otherwise treat a `char*` as a string and print its contents.",
        },
        {
          id: "stack-direction",
          title: "Watching the stack grow downward",
          lang: "cpp",
          code: `#include <iostream>

void inner()  { int x = 0; std::cout << "  inner frame: " << (void*)&x << '\\n'; }
void middle() { int x = 0; std::cout << " middle frame: " << (void*)&x << '\\n'; inner(); }
void outer()  { int x = 0; std::cout << "  outer frame: " << (void*)&x << '\\n'; middle(); }

int main() { outer(); }`,
          output: `  outer frame: 0x7fff2407c62c
 middle frame: 0x7fff2407c60c
  inner frame: 0x7fff2407c5ec`,
          explanation:
            "Each nested call's frame is at a **lower** address — 32 bytes lower each time here. That is the stack growing downward, one frame per call, and it is why deep recursion eventually collides with the guard page at the bottom and produces a segmentation fault. **Run this yourself and the addresses will differ**: address space layout randomisation (ASLR) deliberately varies them between runs as a security measure. The *relationships* stay the same.",
        },
      ],
    },
    {
      id: "stack-vs-heap",
      heading: "Why the stack is fast",
      body: [
        "Stack allocation is essentially free, and it is worth knowing exactly why, because it changes how you write code.",
        "**Allocating a stack frame is one instruction.** The stack pointer register is decremented by the total size of the frame. Deallocating is one instruction to put it back. There is no bookkeeping, no search, no free list.",
        "**It is cache-friendly.** Frames are contiguous and reused constantly, so the top of the stack is almost always already in L1 cache. A local variable is typically a cache hit; a fresh heap object often is not.",
        "**It cannot fragment.** Allocation is strictly last-in-first-out.",
        "Heap allocation has to do real work: find a suitable free block, possibly ask the operating system for more memory, update the allocator's own data structures, and — in a multithreaded program — synchronise, because the heap is shared. A `new` is on the order of **tens to hundreds of nanoseconds**; a stack allocation is well under one.",
        "The rule that follows: **prefer the stack.** Use the heap when the object must outlive the scope that created it, when it is too large for the stack, or when its size is not known at compile time — and even then, prefer a container like `std::vector` that manages the heap for you rather than calling `new` yourself.",
      ],
      pitfalls: [
        {
          title: "A `std::vector` local is a stack object with heap contents",
          body: "This trips people up. `std::vector<int> v(1'000'000);` declares a stack object — but the vector object itself is only about 24 bytes (three pointers), and the million integers live on the heap, allocated by the vector's constructor. That is why it does not overflow the stack, and why it is the right way to have a large array. The same is true of `std::string` beyond about 15 characters, `std::map`, and every other container. **The container is on the stack; its elements are not.**",
        },
      ],
    },
    {
      id: "stack-overflow",
      heading: "Stack overflow",
      body: [
        "The stack has a hard limit, and exceeding it is not an exception you can catch — it is a segmentation fault, because the program has walked off the end of its allocated stack into a deliberately unmapped guard page.",
        "Three ways to do it, in decreasing order of frequency.",
        "**Unbounded recursion.** Either a missing base case, or a depth that scales with input the caller controls. Covered in module 2.",
        "**A very large local array.** `int buffer[10'000'000];` is 40 MB and blows an 8 MB stack immediately. The fix is `std::vector<int> buffer(10'000'000);`, which puts the elements on the heap.",
        "**Deep call chains with large frames**, which is rarer and usually a sign of a design problem.",
        "You can raise the limit — `ulimit -s` on Linux, a linker flag on Windows — but that is treating the symptom. The exception is genuinely recursive algorithms on large data, where converting the recursion to an explicit loop with your own `std::vector` as a stack moves the storage to the heap and removes the limit entirely.",
      ],
      examples: [
        {
          id: "stack-overflow-demo",
          title: "The array that does not fit, and the fix",
          lang: "cpp",
          code: `#include <iostream>
#include <vector>

void too_big() {
    int buffer[10'000'000]{};        // 40 MB on an 8 MB stack
    std::cout << buffer[0] << '\\n';  // never reached
}

void fits() {
    std::vector<int> buffer(10'000'000);   // 24 bytes on the stack, 40 MB on the heap
    std::cout << "vector ok, size " << buffer.size() << '\\n';
}

int main() {
    fits();
    // too_big();   // Segmentation fault (core dumped)
}`,
          output: `vector ok, size 10000000`,
          explanation:
            "Uncomment `too_big()` and the program dies with `Segmentation fault (core dumped)` before printing anything — there is no message naming the cause, which is what makes stack overflow annoying to diagnose. **Note the digit separators in `10'000'000`**, which is C++14 and purely for readability. If you see an unexplained segfault at the top of a function that declares a big local, this is the first thing to check.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing where an object lives",
      body: [
        "A short decision procedure that covers nearly every case in application code.",
        "**Default to a local variable on the stack.** Fast, automatically destroyed, exception-safe by construction.",
        "**Need a variable number of elements?** Use a container — `std::vector`, `std::string`, `std::map`. They use the heap internally and free it in their destructors, so you never write `delete`.",
        "**Need the object to outlive the function that created it?** Use `std::unique_ptr` for a single owner, `std::shared_ptr` when ownership is genuinely shared. Lesson 7 introduces these and module 9 covers them fully.",
        "**Actually calling `new` and `delete` yourself?** Almost never, in modern C++. The cases that remain are implementing a container or allocator, interfacing with a C API that demands raw pointers, and specific performance work like a memory pool. All of those belong inside a class whose destructor cleans up.",
        "The summary a lot of experienced C++ programmers would give: **if you are writing `delete`, you are probably writing a bug.** Not because the operation is wrong, but because the correct place for it is a destructor, and there is almost always a standard type that already has one.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between the stack and the heap?",
      answer:
        "The stack holds function frames — parameters, locals, return addresses — and is allocated by adjusting a register, so allocation is essentially one instruction and always cache-warm. It is small and fixed, around 8 MB on Linux and 1 MB on Windows per thread, and strictly last-in-first-out so it cannot fragment. The heap is managed at runtime by an allocator that must find a block, possibly ask the OS for more memory, and synchronise in a threaded program, making it orders of magnitude slower. The heap is large and its objects live until explicitly freed. Prefer the stack; use the heap when an object must outlive its scope or is too large.",
    },
    {
      question: "Where does a `std::vector`'s data live?",
      answer:
        "The vector *object* lives wherever you declared it — typically the stack, if it is a local — and is only about 24 bytes: pointers to the data, the size and the capacity. The *elements* are on the heap, allocated by the vector and freed in its destructor. That is why `std::vector<int> v(1'000'000);` as a local does not overflow the stack while `int v[1'000'000];` does. The same split applies to `std::string` beyond the small-string optimisation, and to every other standard container.",
    },
    {
      question: "What causes a stack overflow and how do you fix it?",
      answer:
        "Exceeding the fixed stack limit, usually through unbounded recursion or a very large local array. It manifests as a segmentation fault with no message, because the program walked into an unmapped guard page — there is no exception to catch. Fixes: bound the recursion or convert it to an iterative loop with an explicit `std::vector` as the stack, and move large arrays to the heap by using `std::vector`. Raising the limit with `ulimit -s` is available but treats the symptom.",
    },
    {
      question: "Why do local addresses and heap addresses look so different?",
      answer:
        "Because the stack grows downward from the top of the address space while the heap grows upward from just above the statically loaded segments, so both have room to expand without colliding. On 64-bit Linux you typically see locals around `0x7fff…` and heap and static data around `0x55…`, tens of terabytes apart. The exact values change between runs because of address space layout randomisation, which is a security measure — the relationships stay the same but the absolute numbers do not.",
    },
    {
      question: "When should you call `new` and `delete` directly?",
      answer:
        "Almost never in application code. The remaining cases are implementing a container or custom allocator, interfacing with a C API that requires raw pointers, and specific performance work such as a memory pool — and in all of those the allocation belongs inside a class whose destructor releases it. In ordinary code, a container handles a variable number of elements and `std::unique_ptr` or `std::shared_ptr` handles an object that must outlive its scope. If you find yourself writing `delete`, the operation is probably right but the location is probably wrong.",
    },
  ],
  takeaways: [
    "Four regions: code, static storage, heap growing up, and stack growing down — with a vast gap between the last two",
    "Stack allocation is a single register adjustment and is nearly always a cache hit; heap allocation is orders of magnitude slower",
    "The stack is small and fixed — about 8 MB on Linux, 1 MB on Windows, per thread",
    "A container is a small stack object whose elements are on the heap; that is why a big `std::vector` local is fine",
    "Stack overflow is a segfault with no message, caused by unbounded recursion or a large local array",
    "Addresses differ between runs because of ASLR; the relationships do not",
    "Default to the stack, use containers for variable sizes, and smart pointers when an object must outlive its scope",
  ],
  status: "available",
};
