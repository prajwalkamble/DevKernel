import type { Lesson } from "@/content/types";

export const alignmentLesson: Lesson = {
  id: "cpp-alignment",
  slug: "alignment-padding-and-class-layout",
  moduleSlug: "performance-systems",
  title: "Alignment, Padding & the Layout of a Class in Memory",
  summary:
    "Where the bytes actually go. Two structs with identical members measured at 32 and 16 bytes purely from declaration order, why the compiler inserts padding it will not remove, and what `alignas` and packing really cost.",
  estimatedMinutes: 35,
  objectives: [
    "Explain alignment requirements and why they exist",
    "Predict a struct's size and member offsets",
    "Reorder members to eliminate padding",
    "Use `alignas` deliberately, and know when over-alignment helps",
    "Say why packed structs are dangerous rather than merely small",
  ],
  sections: [
    {
      id: "alignment",
      heading: "Alignment and padding",
      body: [
        "**Every type has an alignment: an address multiple its objects must start at.** `char` is 1, `int` is typically 4, `double` and pointers are typically 8. `alignof(T)` reports it.",
        "The requirement comes from the hardware. A load that crosses a cache-line or word boundary may need two memory accesses instead of one; on x86 that is a slowdown, and on some ARM configurations and for SIMD instructions it is a fault. So the compiler guarantees objects are aligned, and it does that by **inserting padding**.",
        "**A struct's size is always a multiple of its alignment**, which is the largest alignment among its members. That trailing padding exists so that in an *array* of the struct, every element is still correctly aligned — which is why you cannot avoid it by reordering.",
        "**Padding between members is avoidable**, and it is entirely determined by declaration order, because the standard requires members to be laid out in declaration order.",
        "**So the rule is: declare members in decreasing order of alignment.** Largest first. It costs nothing, it is invisible at every call site, and the example below shows it halving a struct.",
      ],
      examples: [
        {
          id: "padding",
          title: "The same five members, 32 bytes and 16 bytes",
          lang: "cpp",
          code: `#include <cstddef>
#include <cstdio>
#include <new>

struct Bad  { char a; double b; char c; int d; char e; };   // careless order
struct Good { double b; int d; char a, c, e; };             // largest first

#pragma pack(push, 1)
struct Packed { char a; double b; char c; int d; char e; };
#pragma pack(pop)

struct alignas(64) LineAligned { int x; };

#define SHOW(S, m) std::printf("  %-8s offset %2zu  size %2zu\\n", \\
                               #m, offsetof(S, m), sizeof(S::m))

int main() {
    std::printf("Bad  : sizeof %2zu  alignof %zu\\n", sizeof(Bad), alignof(Bad));
    SHOW(Bad,a); SHOW(Bad,b); SHOW(Bad,c); SHOW(Bad,d); SHOW(Bad,e);

    std::printf("Good : sizeof %2zu  alignof %zu\\n", sizeof(Good), alignof(Good));
    SHOW(Good,b); SHOW(Good,d); SHOW(Good,a); SHOW(Good,c); SHOW(Good,e);

    std::printf("Packed: sizeof %2zu  alignof %zu  (misaligned members!)\\n",
                sizeof(Packed), alignof(Packed));

    std::printf("\\nalignas(64) struct: sizeof %zu alignof %zu\\n",
                sizeof(LineAligned), alignof(LineAligned));
    std::printf("hardware_destructive_interference_size  = %zu\\n",
                std::hardware_destructive_interference_size);
    std::printf("hardware_constructive_interference_size = %zu\\n",
                std::hardware_constructive_interference_size);

    std::printf("\\n1,000,000 elements: Bad %.1f MB, Good %.1f MB (saves %.1f MB)\\n",
                1e6*sizeof(Bad)/1e6, 1e6*sizeof(Good)/1e6,
                1e6*(sizeof(Bad)-sizeof(Good))/1e6);
}`,
          output: `Bad  : sizeof 32  alignof 8
  a        offset  0  size  1     <- 7 bytes of padding follow
  b        offset  8  size  8
  c        offset 16  size  1     <- 3 bytes of padding follow
  d        offset 20  size  4
  e        offset 24  size  1     <- 7 bytes of trailing padding
Good : sizeof 16  alignof 8
  b        offset  0  size  8
  d        offset  8  size  4
  a        offset 12  size  1
  c        offset 13  size  1
  e        offset 14  size  1     <- 1 byte of trailing padding
Packed: sizeof 15  alignof 1  (misaligned members!)

alignas(64) struct: sizeof 64 alignof 64
hardware_destructive_interference_size  = 64
hardware_constructive_interference_size = 64

1,000,000 elements: Bad 32.0 MB, Good 16.0 MB (saves 16.0 MB)`,
          explanation:
            "**Identical members, identical semantics, half the size.** `Bad` wastes 17 of its 32 bytes on padding because a `char` is followed by a `double` that must land on an 8-byte boundary. `Good` declares the `double` first, then the `int`, then the three `char`s, and only one byte of trailing padding remains. **Over a million elements that is 16 MB of pure waste**, and from lesson 2 you know that 16 MB is also 16 MB of extra cache-line traffic. Note `offsetof` and `sizeof` are how you check this rather than guessing — never assume a layout.",
        },
      ],
      pitfalls: [
        {
          title: "`#pragma pack(1)` makes the struct smaller and the code slower or broken",
          body: "Packing removes padding by dropping the alignment guarantee, so `Packed` above is 15 bytes with `alignof` 1 — and its `double` now sits at offset 1. On x86 unaligned access is legal but slower; on some ARM configurations, and for SIMD loads on any platform, it faults. Worse, **taking the address of a packed member gives you a pointer the compiler cannot assume is aligned**, and passing that to anything expecting a normal `double*` is undefined behaviour. Packing is for matching an externally specified binary layout — a file format, a wire protocol, a hardware register block — and even then, reading field by field into a properly aligned struct is safer than casting a buffer to a packed type.",
        },
      ],
    },
    {
      id: "alignas",
      heading: "`alignas`, and when more alignment helps",
      body: [
        "**`alignas(N)` raises a type's or object's alignment.** It can only increase it — you cannot use it to under-align — and it is the standard replacement for compiler-specific attributes.",
        "Three reasons to use it, all measurable.",
        "**Avoiding false sharing.** Module 11 measured a 6× penalty from four atomic counters sharing a cache line. `alignas(std::hardware_destructive_interference_size)` on each element gives them separate lines. That constant is 64 here, matching the cache line size.",
        "**SIMD requirements.** `_mm256_load_ps` requires 32-byte alignment and faults otherwise. `alignas(32)` on the buffer is how you satisfy it, though the unaligned variants exist and are nearly as fast on modern hardware.",
        "**Hardware and DMA buffers**, which often require page or specific boundary alignment.",
        "**The pairing constant is `hardware_constructive_interference_size`**, for data you want to *share* a line — two fields always accessed together should fit within it.",
        "**Over-alignment costs memory.** `alignas(64)` on a struct holding one `int` makes it 64 bytes, so an array of them uses 16× the memory. That is the right trade for a contended counter and badly wrong for anything numerous.",
      ],
      examples: [
        {
          id: "empty-base",
          title: "Where the bytes go in a class, including the invisible ones",
          lang: "cpp",
          code: `#include <cstdio>
#include <memory>
#include <string>
#include <vector>

struct Empty {};                       // no members at all
struct DerivedFromEmpty : Empty { int x; };
struct HasEmptyMember { Empty e; int x; };

struct WithVptr { virtual void f(); int x; };

struct Nested { char a; struct Inner { char b; int c; } inner; char d; };

int main() {
    std::printf("sizeof(Empty)             = %zu  (never 0: distinct addresses)\\n",
                sizeof(Empty));
    std::printf("sizeof(DerivedFromEmpty)  = %zu  (empty BASE optimisation)\\n",
                sizeof(DerivedFromEmpty));
    std::printf("sizeof(HasEmptyMember)    = %zu  (a MEMBER cannot be elided)\\n",
                sizeof(HasEmptyMember));
    std::printf("sizeof(WithVptr)          = %zu  (8 vptr + 4 int + 4 pad)\\n",
                sizeof(WithVptr));
    std::printf("sizeof(Nested)            = %zu  (inner's alignment propagates)\\n",
                sizeof(Nested));

    std::printf("\\nstandard library types:\\n");
    std::printf("  std::string        %zu\\n", sizeof(std::string));
    std::printf("  std::vector<int>   %zu\\n", sizeof(std::vector<int>));
    std::printf("  std::unique_ptr    %zu\\n", sizeof(std::unique_ptr<int>));
    std::printf("  std::shared_ptr    %zu\\n", sizeof(std::shared_ptr<int>));
}`,
          output: `sizeof(Empty)             = 1  (never 0: distinct addresses)
sizeof(DerivedFromEmpty)  = 4  (empty BASE optimisation)
sizeof(HasEmptyMember)    = 8  (a MEMBER cannot be elided)
sizeof(WithVptr)          = 16  (8 vptr + 4 int + 4 pad)
sizeof(Nested)            = 16  (inner's alignment propagates)

standard library types:
  std::string        32
  std::vector<int>   24
  std::unique_ptr    8
  std::shared_ptr    16`,
          explanation:
            "**`DerivedFromEmpty` is 4 bytes and `HasEmptyMember` is 8** — the difference between the empty *base* optimisation and an empty *member*, which must have a distinct address and therefore occupies space plus padding. That is precisely why stateless deleters and comparators are passed as base classes in the standard library rather than stored as members, and why `unique_ptr` with a stateless deleter stayed 8 bytes back in module 9. `Nested` is 16 rather than 7 because `Inner` is itself 8 bytes (a `char`, 3 bytes of padding, then an `int`) and must start on a 4-byte boundary — so the outer struct pays padding before it *and* trailing padding after `d`. Nesting compounds padding.",
        },
      ],
    },
    {
      id: "in-practice",
      heading: "Using this in practice",
      body: [
        "**Reorder members largest-alignment-first as a default habit.** It is free, invisible to callers, and the example above halved a struct with it. Some codebases enforce it with `-Wpadded`, though that warning is noisy enough that most people run it occasionally rather than continuously.",
        "**Check rather than assume.** `sizeof`, `alignof` and `offsetof` are the tools; `static_assert(sizeof(T) == 16)` in a header is a cheap regression test for a type whose size matters.",
        "**Shrink types before restructuring them.** Replacing an `int` with a `std::uint16_t`, an enum with `enum class E : std::uint8_t`, or a `bool` array with a bitset often halves a structure with far less disruption than moving to SoA. A smaller type means more elements per cache line, which is the same win by a different route.",
        "**Do not rely on layout across compilers or ABIs.** The standard guarantees declaration order within an access-control section and nothing about padding. Two compilers, two versions of one compiler, or two settings can differ. Anything crossing a process or machine boundary needs explicit serialisation, not a `memcpy` of a struct.",
        "**And remember it interacts with everything else in this module**: padding is wasted cache-line space, over-alignment is wasted memory, and `alignas` is the tool that fixes false sharing.",
      ],
      examples: [
        {
          id: "shrinking",
          title: "Shrinking a type without restructuring it",
          lang: "cpp",
          code: `#include <cstdint>
#include <cstdio>

// Before: everything is the default-sized type someone reached for.
struct EventBefore {
    bool          active;      // 1 byte of information
    int           kind;        // ~8 possible values
    double        timestamp;   // seconds; microsecond precision needed
    unsigned long id;          // fits in 32 bits for this system
    int           priority;    // 0-3
};

// After: each field sized to what it actually holds, largest first.
enum class Kind : std::uint8_t { Click, Key, Move, Scroll, Resize, Focus };

struct EventAfter {
    std::uint64_t timestampUs;  // microseconds since epoch, exact
    std::uint32_t id;
    Kind          kind;         // 1 byte
    std::uint8_t  priority;     // 0-3 needs 2 bits
    bool          active;
};

static_assert(sizeof(EventAfter) == 16,
              "EventAfter must stay at 16 bytes -- it is in a hot array");

int main() {
    std::printf("EventBefore : %2zu bytes  (align %zu)\\n",
                sizeof(EventBefore), alignof(EventBefore));
    std::printf("EventAfter  : %2zu bytes  (align %zu)\\n",
                sizeof(EventAfter), alignof(EventAfter));

    const std::size_t n = 10'000'000;
    std::printf("\\n%zu events:\\n", n);
    std::printf("  before : %5.1f MB   (%zu per 64-byte cache line)\\n",
                double(n * sizeof(EventBefore)) / 1e6, 64 / sizeof(EventBefore));
    std::printf("  after  : %5.1f MB   (%zu per 64-byte cache line)\\n",
                double(n * sizeof(EventAfter)) / 1e6, 64 / sizeof(EventAfter));
}`,
          output: `EventBefore : 32 bytes  (align 8)
EventAfter  : 16 bytes  (align 8)

10000000 events:
  before : 320.0 MB   (2 per 64-byte cache line)
  after  : 160.0 MB   (4 per 64-byte cache line)`,
          explanation:
            "**Half the memory and twice the events per cache line, with no change to the algorithm and no move to SoA.** The `double` timestamp became a `uint64_t` of microseconds — which is *more* precise, since a `double` loses integer precision past 2⁵³ — the `int` kind became a one-byte `enum class`, and the two small integers became `uint8_t`. The `static_assert` is the part worth copying: it turns \"someone widened a field in a hot structure\" from an invisible regression into a build failure.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why does the compiler insert padding, and why can't you always remove it?",
      answer:
        "To satisfy alignment: every type has an address multiple its objects must start at, because a load crossing a word or cache-line boundary may take two accesses, and on some ARM configurations and for SIMD it faults outright. Padding between members is avoidable, since it depends entirely on declaration order and the standard requires members to be laid out in that order. Trailing padding is not avoidable: a struct's size must be a multiple of its alignment so that in an *array* of the struct every element remains correctly aligned. So reordering removes internal padding but never the tail.",
      },
    {
      question: "How do you minimise a struct's size?",
      answer:
        "Declare members in decreasing order of alignment — largest first. Measured on five members: `{char, double, char, int, char}` is 32 bytes with 17 wasted on padding, while `{double, int, char, char, char}` with the identical members is 16. Over a million elements that is 16 MB saved, and by lesson 2's reasoning it is also 16 MB less cache traffic. Beyond ordering, shrink the types themselves — a `uint16_t` instead of an `int`, an `enum class E : uint8_t` instead of a plain enum — which is often a bigger win than reordering and far less disruptive than moving to struct-of-arrays.",
    },
    {
      question: "What does `#pragma pack(1)` do and why is it dangerous?",
      answer:
        "It removes padding by dropping the alignment guarantee, so a struct that was 32 bytes becomes 15 with `alignof` 1 and its `double` sitting at offset 1. On x86 unaligned access is legal but slower; on some ARM configurations and for SIMD loads it faults. The subtler hazard is that taking the address of a packed member yields a pointer the compiler cannot assume is aligned, and passing it anywhere expecting a normal `double*` is undefined behaviour. It is for matching an externally specified binary layout — a file format, a wire protocol, hardware registers — and even then, parsing field by field into an aligned struct is safer than casting a buffer.",
    },
    {
      question: "What is the empty base optimisation?",
      answer:
        "An empty class must have non-zero size so distinct objects have distinct addresses, so `sizeof(Empty)` is 1. But an empty *base* subobject may share an address with the derived object, so `struct D : Empty { int x; }` is 4 bytes while `struct M { Empty e; int x; }` is 8 — the member cannot be elided and drags padding with it. This is why the standard library stores stateless deleters, comparators and allocators as base classes rather than members, and it is why `unique_ptr` with a stateless custom deleter stays the size of one pointer while a function-pointer deleter doubles it. C++20's `[[no_unique_address]]` extends the same optimisation to members.",
    },
    {
      question: "When is `alignas` worth using?",
      answer:
        "Three cases. To avoid false sharing — module 11 measured a 6× penalty from four atomic counters on one cache line, fixed with `alignas(std::hardware_destructive_interference_size)`, which is 64 on this machine. To satisfy SIMD requirements, since instructions like `_mm256_load_ps` need 32-byte alignment and fault otherwise. And for DMA or hardware buffers with specific boundary requirements. It can only increase alignment, never reduce it. The cost is memory: `alignas(64)` on a struct containing one `int` makes it 64 bytes, so an array uses 16× the space — correct for a contended counter, badly wrong for anything numerous.",
    },
    {
      question: "Can you rely on struct layout being the same across compilers?",
      answer:
        "No. The standard guarantees only that members are laid out in declaration order within an access-control section, and says nothing about how much padding appears. Two compilers, two versions of one compiler, or two flag settings can produce different sizes and offsets, and bit-field layout is even less specified. So anything crossing a process, machine or version boundary needs explicit serialisation — writing fields individually with defined sizes and endianness — rather than a `memcpy` of the struct. Within one build you can verify assumptions with `static_assert` on `sizeof` and `offsetof`, which is worth doing for types whose size matters.",
    },
  ],
  takeaways: [
    "Every type has an alignment; the compiler inserts padding to satisfy it",
    "A struct's size is a multiple of its alignment, so trailing padding is unavoidable",
    "Padding *between* members is avoidable and depends only on declaration order",
    "Declare members largest-alignment-first: 32 bytes became 16 with identical members",
    "Over a million elements that is 16 MB, and 16 MB of extra cache traffic",
    "Use `sizeof`, `alignof` and `offsetof` to check — never assume a layout",
    "`static_assert(sizeof(T) == N)` turns a silent size regression into a build failure",
    "`#pragma pack(1)` gives misaligned members and pointers the compiler cannot trust",
    "An empty base costs nothing; an empty member costs a byte plus padding",
    "`alignas` can only increase alignment, and costs memory proportionally",
    "`hardware_destructive_interference_size` is 64 here — the anti-false-sharing constant",
    "Shrinking field types often beats reordering and always beats restructuring",
    "Layout is not portable across compilers — serialise explicitly at boundaries",
  ],
  status: "available",
};
