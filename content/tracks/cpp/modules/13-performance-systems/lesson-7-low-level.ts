import type { Lesson } from "@/content/types";

export const lowLevelLesson: Lesson = {
  id: "cpp-low-level",
  slug: "bit-manipulation-span-and-byte",
  moduleSlug: "performance-systems",
  title: "Bit Manipulation, std::span & std::byte for Low-Level Work",
  summary:
    "The C++20 vocabulary for working close to the machine without leaving the type system. `<bit>` replacing hand-rolled intrinsics, `std::span` carrying its own length so a pointer-plus-size pair cannot desynchronise, and `std::byte` making \"raw storage\" a distinct type from \"small integer\".",
  estimatedMinutes: 35,
  objectives: [
    "Use `<bit>` instead of compiler intrinsics or bit-twiddling hacks",
    "Replace pointer-plus-length parameters with `std::span`",
    "Explain what `std::byte` is for and why `char` was wrong",
    "Choose between dynamic and static extents",
    "Handle endianness explicitly rather than assuming",
  ],
  sections: [
    {
      id: "bit",
      heading: "`<bit>`",
      body: [
        "Bit manipulation used to mean compiler intrinsics — `__builtin_popcount`, `_BitScanForward`, `__builtin_clz` — each spelled differently per compiler, or the collection of hacks from *Hacker's Delight* that nobody can read six months later.",
        "**C++20's `<bit>` standardises them**, and they compile to the single instruction the hardware provides.",
        "**`std::popcount`** counts set bits. **`std::countl_zero`** and **`std::countr_zero`** count leading and trailing zeros, with `countl_one`/`countr_one` for the complements. **`std::bit_width`** gives the number of bits needed to represent a value — that is `floor(log2(x)) + 1`, without floating point.",
        "**`std::has_single_bit`** tests for a power of two. **`std::bit_ceil`** and **`std::bit_floor`** round to the nearest power of two, which is exactly what a hash table's bucket-count calculation needs.",
        "**`std::rotl` and `std::rotr`** rotate. Writing a rotation by hand as `(x << n) | (x >> (32 - n))` is undefined behaviour when `n` is 0, because shifting by the width is undefined — a bug that appears only at an edge case, and which the standard functions do not have.",
        "**`std::bit_cast`** reinterprets an object's bytes as another type of the same size, and unlike `reinterpret_cast` it is defined and `constexpr`. Lesson 1 measured it compiling to a single `movd`.",
        "**`std::endian`** reports the platform's byte order as a compile-time constant.",
      ],
      examples: [
        {
          id: "bit-tour",
          title: "`<bit>`, `std::byte` and `std::span` together",
          lang: "cpp",
          code: `#include <bit>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <span>
#include <vector>

// std::byte is raw storage, NOT a small integer -- no arithmetic on it.
// A span parameter carries its own length, so this cannot be miscalled.
void hexDump(std::span<const std::byte> data) {
    for (std::size_t i = 0; i < data.size(); ++i) {
        if (i % 8 == 0) std::printf("\\n  %04zx: ", i);
        std::printf("%02x ", std::to_integer<unsigned>(data[i]));
    }
    std::printf("\\n");
}

int sum(std::span<const int> s) { int t = 0; for (int v : s) t += v; return t; }

int main() {
    std::printf("=== <bit> (C++20) ===\\n");
    std::uint32_t x = 0b0000'0000'0000'0000'0000'0001'0110'1000;
    std::printf("x = %u (0x%08x)\\n", x, x);
    std::printf("  popcount    = %d  (set bits)\\n", std::popcount(x));
    std::printf("  countl_zero = %d  (leading zeros)\\n", std::countl_zero(x));
    std::printf("  countr_zero = %d  (trailing zeros)\\n", std::countr_zero(x));
    std::printf("  bit_width   = %d  (bits needed)\\n", std::bit_width(x));
    std::printf("  bit_ceil    = %u  (next power of 2)\\n", std::bit_ceil(x));
    std::printf("  has_single_bit(64) = %d\\n", std::has_single_bit(64u));
    std::printf("  rotl(x,4)   = 0x%08x\\n", std::rotl(x, 4));
    std::printf("  endian::native is %s\\n",
        std::endian::native == std::endian::little ? "little" : "big");

    std::printf("\\n=== std::byte ===\\n");
    std::uint32_t value = 0xDEADBEEF;
    std::byte raw[sizeof(value)];
    std::memcpy(raw, &value, sizeof(value));
    hexDump(raw);
    std::printf("  (little-endian, so the bytes are reversed)\\n");

    std::printf("\\n=== std::span ===\\n");
    int arr[]{1,2,3,4,5};
    std::vector<int> vec{10,20,30};
    std::printf("  sum(C array)  = %d\\n", sum(arr));
    std::printf("  sum(vector)   = %d\\n", sum(vec));
    std::printf("  sum(subspan)  = %d\\n", sum(std::span{arr}.subspan(1, 3)));
    std::printf("  sizeof(span<int>) = %zu (pointer + length)\\n",
                sizeof(std::span<int>));
    std::printf("  sizeof(span<int,5>) = %zu (static extent: length is in the TYPE)\\n",
                sizeof(std::span<int,5>));
}`,
          output: `=== <bit> (C++20) ===
x = 360 (0x00000168)
  popcount    = 4  (set bits)
  countl_zero = 23  (leading zeros)
  countr_zero = 3  (trailing zeros)
  bit_width   = 9  (bits needed)
  bit_ceil    = 512  (next power of 2)
  has_single_bit(64) = 1
  rotl(x,4)   = 0x00001680
  endian::native is little

=== std::byte ===

  0000: ef be ad de
  (little-endian, so the bytes are reversed)

=== std::span ===
  sum(C array)  = 15
  sum(vector)   = 60
  sum(subspan)  = 9
  sizeof(span<int>) = 16 (pointer + length)
  sizeof(span<int,5>) = 8 (static extent: length is in the TYPE)`,
          explanation:
            "**`sum` was called with a C array, a `std::vector` and a sub-range, and the size came along every time.** No length parameter, no chance of passing the wrong one. The `std::byte` dump shows `ef be ad de` for the value `0xDEADBEEF` — the bytes are stored least-significant-first because this machine is little-endian, which `std::endian::native` reports as a compile-time constant. And note the last two lines: a dynamic-extent span is 16 bytes because it stores a length, while `span<int,5>` is 8 because the length is part of the type.",
        },
      ],
      pitfalls: [
        {
          title: "Hand-rolled rotation is undefined behaviour at zero",
          body: "`(x << n) | (x >> (32 - n))` is the textbook rotation and it is broken: when `n` is 0, the second shift is `x >> 32`, and shifting by the operand's width is undefined behaviour. It usually happens to produce the right answer on x86 because the hardware masks the shift count to 5 bits, so `>> 32` becomes `>> 0` — and then fails on a different architecture or after the optimiser reasons from the UB, exactly as lesson 1 described. `std::rotl` and `std::rotr` are correct for every count including 0 and counts larger than the width, and compile to the single `rol`/`ror` instruction.",
        },
      ],
    },
    {
      id: "span",
      heading: "`std::span`",
      body: [
        "**A span is a pointer and a length, with the length travelling as part of the value.** It owns nothing, costs 16 bytes with a dynamic extent, and is the correct parameter type for \"a contiguous sequence of `T` I will read or modify but not keep.\"",
        "It replaces the C idiom that has caused decades of buffer overflows: `void process(int* data, size_t n)`, where nothing connects the two arguments and a caller can pass a mismatched pair with no diagnostic.",
        "**It converts implicitly from anything contiguous** — a C array, `std::array`, `std::vector`, another span — so one function signature serves all of them without templates.",
        "**`subspan`, `first` and `last` produce sub-ranges without copying**, which is what makes it good for parsing: you carve a buffer into pieces and each piece knows its own bounds.",
        "**A static extent — `std::span<int, 5>` — puts the length in the type**, so it is 8 bytes rather than 16 and the size is a compile-time constant available for unrolling. Use it when the length genuinely is fixed.",
        "**The lifetime rule is `string_view`'s rule**: a span does not own its data, so it must not outlive what it points at. Returning a span to a local, or holding one across an operation that reallocates the underlying vector, is a dangling reference — and module 8 measured that a `push_back` invalidates everything.",
        "**`std::as_bytes` and `std::as_writable_bytes`** convert any span into a `span<const std::byte>`, which is the standard way to get at an object's representation for hashing, checksumming or serialisation.",
      ],
      examples: [
        {
          id: "span-parsing",
          title: "Parsing a buffer with spans, where every piece knows its bounds",
          lang: "cpp",
          code: `#include <cstdint>
#include <cstdio>
#include <cstring>
#include <optional>
#include <span>
#include <vector>

// A length-prefixed record: [u16 length][payload bytes]
// Every step returns a span, so nothing ever loses track of its size.
struct Record {
    std::span<const std::byte> payload;
    std::span<const std::byte> rest;
};

std::optional<Record> parseOne(std::span<const std::byte> in) {
    if (in.size() < 2) return std::nullopt;                 // bounds are checked
    std::uint16_t len;
    std::memcpy(&len, in.data(), sizeof(len));              // defined, unlike a cast
    auto body = in.subspan(2);
    if (body.size() < len) return std::nullopt;
    return Record{body.first(len), body.subspan(len)};
}

// as_bytes turns any contiguous range into its byte representation.
std::uint32_t fnv1a(std::span<const std::byte> data) {
    std::uint32_t h = 2166136261u;
    for (std::byte b : data) {
        h ^= std::to_integer<std::uint32_t>(b);
        h *= 16777619u;
    }
    return h;
}

int main() {
    // Build: two records, "hello" and "hi".
    std::vector<std::byte> buf;
    auto append = [&](const char* s) {
        std::uint16_t n = static_cast<std::uint16_t>(std::strlen(s));
        auto* p = reinterpret_cast<const std::byte*>(&n);
        buf.insert(buf.end(), p, p + sizeof(n));
        auto* q = reinterpret_cast<const std::byte*>(s);
        buf.insert(buf.end(), q, q + n);
    };
    append("hello");
    append("hi");

    std::span<const std::byte> cursor{buf};
    int i = 0;
    while (auto rec = parseOne(cursor)) {
        std::printf("record %d: %zu bytes = \\"", ++i, rec->payload.size());
        for (std::byte b : rec->payload)
            std::printf("%c", static_cast<char>(std::to_integer<unsigned>(b)));
        std::printf("\\"\\n");
        cursor = rec->rest;
    }
    std::printf("bytes remaining: %zu\\n", cursor.size());

    std::vector<int> nums{1, 2, 3, 4};
    std::printf("fnv1a over the ints' bytes: 0x%08x  (%zu bytes)\\n",
                fnv1a(std::as_bytes(std::span{nums})),
                std::as_bytes(std::span{nums}).size());
}`,
          output: `record 1: 5 bytes = "hello"
record 2: 2 bytes = "hi"
bytes remaining: 0
fnv1a over the ints' bytes: 0x3e141bc1  (16 bytes)`,
          explanation:
            "**Every bounds check in `parseOne` is against a size the span carried with it** — there is no separate length parameter to get wrong, and `subspan` cannot produce a range extending past the original. That is the whole argument for the type. Note `std::memcpy` rather than casting the pointer to `uint16_t*`: the cast would violate strict aliasing and may be misaligned, while `memcpy` is defined and the compiler turns it into a single load anyway. `as_bytes` gives 16 bytes for four `int`s, which is the object representation you would hash or write to a socket.",
        },
      ],
    },
    {
      id: "byte-and-endian",
      heading: "`std::byte`, and being explicit about representation",
      body: [
        "**`std::byte` is an `enum class` over `unsigned char`.** That is the entire design, and it does exactly one thing: it makes \"raw storage\" a type distinct from \"small integer\".",
        "`char`, `signed char` and `unsigned char` were all pressed into service as byte types, and all three are arithmetic types — so `buffer[0] + 1` compiles, `std::cout << buffer[0]` prints a character rather than a number, and `char`'s signedness is implementation-defined, so `buffer[0] > 127` differs between platforms.",
        "**`std::byte` supports only bitwise operations** — `&`, `|`, `^`, `~`, `<<`, `>>` — plus explicit conversion via `std::to_integer<T>`. Arithmetic does not compile. Use it for buffers, serialisation, and anything where the bytes are storage rather than text or numbers.",
        "**It retains the aliasing exemption**: like `char` and `unsigned char`, `std::byte*` may alias any object, which is what makes it legal to inspect an object's representation.",
        "**Endianness must be handled explicitly at every boundary.** Writing a `uint32_t` to a file or socket and reading it on another machine only works if both agree on byte order, and they may not. `std::endian` reports the platform's; `std::byteswap` (C++23) reverses one; before that, `__builtin_bswap32` or a manual shift-and-mask.",
        "**The rule for any external format: pick an order, convert on write and on read, and never `memcpy` a struct.** Network protocols conventionally use big-endian; most file formats specify one; a format that does not specify is a bug in the format.",
      ],
      examples: [
        {
          id: "endian",
          title: "Serialising explicitly, so the format does not depend on the machine",
          lang: "cpp",
          code: `#include <bit>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <span>
#include <vector>

// Explicit big-endian encode/decode. No memcpy of structs, no assumption
// about the host's byte order -- the format is defined by these functions.
void putU32BE(std::vector<std::byte>& out, std::uint32_t v) {
    out.push_back(static_cast<std::byte>((v >> 24) & 0xFF));
    out.push_back(static_cast<std::byte>((v >> 16) & 0xFF));
    out.push_back(static_cast<std::byte>((v >>  8) & 0xFF));
    out.push_back(static_cast<std::byte>( v        & 0xFF));
}

std::uint32_t getU32BE(std::span<const std::byte> in) {
    return (std::to_integer<std::uint32_t>(in[0]) << 24)
         | (std::to_integer<std::uint32_t>(in[1]) << 16)
         | (std::to_integer<std::uint32_t>(in[2]) <<  8)
         |  std::to_integer<std::uint32_t>(in[3]);
}

int main() {
    std::printf("host is %s-endian\\n",
        std::endian::native == std::endian::little ? "little" : "big");

    const std::uint32_t original = 0x01020304;

    // The WRONG way: the bytes depend on the machine.
    std::byte hostOrder[4];
    std::memcpy(hostOrder, &original, 4);
    std::printf("memcpy of the object   : ");
    for (auto b : hostOrder) std::printf("%02x ", std::to_integer<unsigned>(b));
    std::printf("  <- machine-dependent\\n");

    // The RIGHT way: the bytes are defined by the format.
    std::vector<std::byte> wire;
    putU32BE(wire, original);
    std::printf("explicit big-endian    : ");
    for (auto b : wire) std::printf("%02x ", std::to_integer<unsigned>(b));
    std::printf("  <- same on every machine\\n");

    std::printf("round trip             : 0x%08x -> 0x%08x  %s\\n",
                original, getU32BE(wire),
                getU32BE(wire) == original ? "OK" : "MISMATCH");

    // std::byte refuses arithmetic, which is the point.
    std::byte b{0x0F};
    b = b | std::byte{0xF0};                 // bitwise: fine
    // b = b + std::byte{1};                 // ERROR: no operator+
    std::printf("bitwise or             : 0x%02x\\n", std::to_integer<unsigned>(b));
}`,
          output: `host is little-endian
memcpy of the object   : 04 03 02 01   <- machine-dependent
explicit big-endian    : 01 02 03 04   <- same on every machine
round trip             : 0x01020304 -> 0x01020304  OK
bitwise or             : 0xff`,
          explanation:
            "**The two byte sequences differ, and that is the bug the explicit version prevents.** `memcpy` of the object gave `04 03 02 01` on this little-endian machine and would give `01 02 03 04` on a big-endian one — so a file written by one and read by the other silently produces the wrong number. The shift-and-mask version produces `01 02 03 04` everywhere, because the format is defined by the code rather than by the hardware. The commented-out `b + std::byte{1}` is `std::byte` doing its job: **the type will not let you treat storage as a number by accident.**",
        },
      ],
      pitfalls: [
        {
          title: "`std::span<T>` is a pointer — `const` applies to the wrong thing",
          body: "`const std::span<int> s` makes the *span* const, not its elements: you cannot reassign `s`, but `s[0] = 42` compiles and modifies the underlying data. The element type carries the constness, so read-only access is `std::span<const int>`. This is exactly the `T* const` versus `const T*` distinction and catches people for the same reason. Take `std::span<const T>` for parameters you only read, which also lets callers pass a `const` container — a `std::span<int>` will not bind to a `const std::vector<int>&` at all.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does `<bit>` give you over compiler intrinsics?",
      answer:
        "Portability and correctness with no performance cost — `std::popcount`, `std::countl_zero`, `std::countr_zero`, `std::bit_width`, `std::has_single_bit`, `std::bit_ceil`, `std::rotl` and `std::rotr` all compile to the single hardware instruction where one exists, but are spelled the same on every compiler. `__builtin_popcount` is GCC and Clang; `__popcnt` is MSVC. They are also `constexpr`, so they work at compile time. And several are more correct than the hand-written equivalents: `std::rotl` handles a count of 0 and counts exceeding the width, where `(x << n) | (x >> (32 - n))` is undefined behaviour when `n` is 0.",
    },
    {
      question: "Why is `std::span` better than a pointer and a length?",
      answer:
        "Because the length travels with the pointer as one value, so they cannot desynchronise — the caller cannot pass a mismatched pair, and `subspan`, `first` and `last` cannot produce a range extending past the original. It converts implicitly from C arrays, `std::array`, `std::vector` and other spans, so one non-template signature serves all of them. It costs 16 bytes with a dynamic extent, or 8 with a static extent since the length is then part of the type. The constraint is the same as `string_view`: it owns nothing, so it must not outlive its data or survive a reallocation of the underlying container.",
    },
    {
      question: "What is `std::byte` for, and why was `char` inadequate?",
      answer:
        "It makes \"raw storage\" a type distinct from \"small integer\". `char`, `signed char` and `unsigned char` are all arithmetic types, so `buffer[0] + 1` compiles, streaming one prints a character rather than a number, and plain `char`'s signedness is implementation-defined — so `buffer[0] > 127` behaves differently across platforms. `std::byte` is an `enum class` over `unsigned char` supporting only bitwise operations plus explicit `std::to_integer<T>` conversion; arithmetic does not compile. It keeps the aliasing exemption, so a `std::byte*` may legally inspect any object's representation.",
    },
    {
      question: "What is the difference between `const std::span<int>` and `std::span<const int>`?",
      answer:
        "`const std::span<int>` makes the span object const — you cannot reassign it — but `s[0] = 42` still compiles and modifies the underlying data, because the span is a pointer and constness on the pointer does not propagate to the pointee. `std::span<const int>` makes the *elements* read-only, which is what you almost always want for a parameter. It is the same distinction as `T* const` versus `const T*`. A further practical consequence: a `std::span<int>` will not bind to a `const std::vector<int>&` at all, so a read-only parameter must be `std::span<const T>` to be callable with const containers.",
    },
    {
      question: "How should you handle endianness?",
      answer:
        "Explicitly, at every external boundary, with shift-and-mask code that defines the format independently of the hardware. Never `memcpy` a struct or an integer into a buffer that leaves the process: measured on a little-endian machine, `memcpy` of `0x01020304` produces the bytes `04 03 02 01`, while a big-endian machine produces `01 02 03 04` — so a file written by one and read by the other silently yields the wrong number. The tools are `std::endian` to query the platform at compile time, `std::byteswap` in C++23, and `__builtin_bswap32` or manual shifts before that. Network protocols conventionally use big-endian; a format that does not specify an order is a defective format.",
    },
    {
      question: "When would you use a static extent span?",
      answer:
        "When the length is genuinely fixed at compile time — a fixed-size header, a hash digest, a 4×4 matrix. `std::span<int, 5>` is 8 bytes rather than 16, because the length lives in the type rather than the object, and the size becomes a compile-time constant the optimiser can use for full unrolling or bounds elimination. The cost is that the type no longer accepts ranges of other lengths, so it is unsuitable for anything variable, and mixing static- and dynamic-extent spans in one interface tends to produce conversion friction. Default to dynamic extent and reach for static when the fixed size is a real property of the data.",
    },
  ],
  takeaways: [
    "`<bit>` standardises popcount, count-zeros, bit-width, power-of-two rounding and rotation",
    "They compile to single instructions and are `constexpr`",
    "Hand-rolled rotation is UB when the count is 0 — `std::rotl` is not",
    "`std::bit_cast` is defined, `constexpr`, and compiles to the same instruction as the UB cast",
    "`std::span` carries its length, so a pointer/size pair cannot desynchronise",
    "It converts from C arrays, `std::array`, `std::vector` and other spans with no template",
    "16 bytes for a dynamic extent, 8 for a static one where the length is in the type",
    "`const std::span<int>` is a const span of mutable ints — use `std::span<const int>`",
    "A span owns nothing: it must not outlive its data or survive a reallocation",
    "`std::as_bytes` gives an object's representation for hashing or serialisation",
    "`std::byte` is an `enum class` over `unsigned char` — bitwise only, no arithmetic",
    "It keeps the aliasing exemption, so it may legally inspect any object",
    "`memcpy` of an integer gives machine-dependent bytes — define wire formats explicitly",
  ],
  status: "available",
};
