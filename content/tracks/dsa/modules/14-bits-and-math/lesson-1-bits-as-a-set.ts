import type { Lesson } from "@/content/types";

export const bitsAsASetLesson: Lesson = {
  id: "dsa-bits-set",
  slug: "bits-as-a-set",
  moduleSlug: "bit-manipulation-and-math",
  title: "Bits as a Set",
  summary:
    "An integer is a set of up to 64 elements with constant-time add, remove, test and union. The five operations that give you that, the two tricks worth memorising, and the shift that goes wrong on negative numbers.",
  estimatedMinutes: 30,
  objectives: [
    "Set, clear, test and toggle a single bit",
    "Read an integer as a subset of {0, 1, ..., 63}",
    "Use `n & -n` and `n & (n - 1)`, and say what each one does",
    "Count set bits in O(popcount) rather than O(width)",
    "Avoid the signed-shift and operator-precedence traps",
  ],
  sections: [
    {
      id: "the-reframe",
      heading: "Stop reading it as a number",
      body: [
        "Bit manipulation feels like trivia right up to the moment you stop thinking of an integer as a *number* and start thinking of it as a **set**.",
        "Bit `i` is either present or absent. So a 32-bit integer is a subset of `{0, 1, ..., 31}`, and the bitwise operators are set operations: `|` is union, `&` is intersection, `^` is symmetric difference, `~` is complement. Every one of them runs in a single CPU instruction on the whole set at once.",
        "That is the entire reason this topic matters for interviews. When a problem says *n ≤ 20 and you must consider every subset*, it is telling you that a subset fits in an integer and that there are only a million of them. The alternative — a `HashSet` per subset — is a hundred times slower and allocates.",
      ],
    },
    {
      id: "five-operations",
      heading: "The five operations",
      body: [
        "Everything else is built out of these. `1 << i` is the mask with only bit `i` set; each operation combines it with the target differently.",
      ],
      examples: [
        {
          id: "bit-ops",
          title: "Set, test, clear, toggle — and the two tricks",
          lang: "python",
          code: `def show(n, width=8):
    return format(n, f"0{width}b")

mask = 0
print("start          ", show(mask))

# set bit i
for i in (0, 2, 5):
    mask |= 1 << i
    print(f"set bit {i}      ", show(mask))

# test bit i
for i in (2, 3):
    print(f"test bit {i}     ", (mask >> i) & 1 == 1)

# clear bit 2
mask &= ~(1 << 2)
print("clear bit 2    ", show(mask))

# toggle bit 0
mask ^= 1 << 0
print("toggle bit 0   ", show(mask))

# lowest set bit
m = 0b10110000
print()
print("m              ", show(m))
print("m & -m         ", show(m & -m), " <- isolates the lowest set bit")
print("m & (m-1)      ", show(m & (m - 1)), " <- clears the lowest set bit")
print("popcount       ", bin(m).count("1"))

# counting bits by clearing the lowest, one iteration per set bit
n, count = m, 0
while n:
    n &= n - 1
    count += 1
print("kernighan count", count)`,
          output: `start           00000000
set bit 0       00000001
set bit 2       00000101
set bit 5       00100101
test bit 2      True
test bit 3      False
clear bit 2     00100001
toggle bit 0    00100000

m               10110000
m & -m          00010000  <- isolates the lowest set bit
m & (m-1)       10100000  <- clears the lowest set bit
popcount        3
kernighan count 3`,
          explanation:
            "The two lines worth committing to memory are the last pair. **`n & -n`** isolates the lowest set bit and nothing else — it works because `-n` is `~n + 1` in two's complement, which flips every bit above the lowest set one and leaves that one standing. **`n & (n - 1)`** clears the lowest set bit, because subtracting one borrows through the trailing zeros and turns the lowest one into a zero. Loop on the second and you count set bits in one iteration *per set bit* rather than one per bit width — Kernighan's trick, and the reason a sparse mask is cheap to walk.",
        },
      ],
    },
    {
      id: "in-java",
      heading: "The same operations, and two Java-specific traps",
      body: [
        "Java gives you `Integer.bitCount`, which compiles to a single `POPCNT` instruction and is what you should actually use. But it also has two sharp edges Python does not.",
      ],
      examples: [
        {
          id: "bits-java",
          title: "Java: bitCount, the signed shift, and precedence",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static String show(int n) {
        return String.format("%8s", Integer.toBinaryString(n)).replace(' ', '0');
    }

    public static void main(String[] args) {
        int mask = 0;
        mask |= (1 << 0) | (1 << 2) | (1 << 5);
        System.out.println("mask           " + show(mask));
        System.out.println("bit 2 set?     " + (((mask >> 2) & 1) == 1));

        int m = 0b10110000;
        System.out.println("m              " + show(m));
        System.out.println("m & -m         " + show(m & -m));
        System.out.println("m & (m-1)      " + show(m & (m - 1)));
        System.out.println("bitCount       " + Integer.bitCount(m));

        // The shift trap: >> keeps the sign, >>> does not.
        int neg = -8;
        System.out.println();
        System.out.println("-8 >> 1        " + (neg >> 1));
        System.out.println("-8 >>> 1       " + (neg >>> 1));

        // Precedence: & binds looser than ==, so the parentheses are required.
        int flags = 0b1010;
        System.out.println("(flags & 2) != 0  " + ((flags & 2) != 0));
    }
}`,
          output: `mask           00100101
bit 2 set?     true
m              10110000
m & -m         00010000
m & (m-1)      10100000
bitCount       3

-8 >> 1        -4
-8 >>> 1       2147483644
(flags & 2) != 0  true`,
          explanation:
            "`>>` is an *arithmetic* shift: it copies the sign bit in from the left, so `-8 >> 1` is `-4` — which is what you want when you are dividing, and disastrous when you are walking bits. `>>>` shifts in zeros, and `-8 >>> 1` is a large positive number. When you are treating an integer as a set, `>>>` is almost always the one you mean.",
        },
      ],
      pitfalls: [
        {
          title: "`&` binds more loosely than `==` in C, C++, Java and Python",
          body: "`flags & 2 != 0` parses as `flags & (2 != 0)`, which is `flags & 1` — a completely different question that silently returns a plausible answer. Always parenthesise: `(flags & 2) != 0`. This is one of the oldest bugs in C and it survives into every language that inherited the precedence table.",
        },
        {
          title: "`1 << 40` is zero in a 32-bit int",
          body: "In Java and C, `1` is an `int`, so shifting by 40 wraps the shift count modulo 32 and gives you `1 << 8`. Write `1L << 40` when the mask needs more than 32 bits. Python has no such limit, which is exactly why a solution that works there can fail when translated.",
        },
      ],
    },
    {
      id: "when",
      heading: "Recognising the signal",
      body: [
        "**`n ≤ 20` or `n ≤ 25`, with something about subsets or assignments.** That is a bitmask problem. Two to the twenty is a million; two to the twenty-five is thirty-three million. Both are fine.",
        "**A small fixed alphabet.** \"Lowercase English letters\" means 26 bits, so a set of letters fits in one `int` and comparing two words for shared letters is a single `&`.",
        "**\"Without using extra space\"** alongside a small value range. A `boolean[64]` is extra space; a `long` is not.",
      ],
    },
  ],
  takeaways: [
    "An integer is a set: `|` unions, `&` intersects, `^` is symmetric difference",
    "`1 << i` is the mask for element i; set with `|=`, clear with `&= ~`, toggle with `^=`",
    "`n & -n` isolates the lowest set bit; `n & (n - 1)` clears it",
    "Kernighan's loop counts set bits in one iteration per set bit",
    "`>>` keeps the sign; use `>>>` in Java when the integer is a set",
    "`&` binds looser than `==` — parenthesise every mask test",
    "`n ≤ 20` plus subsets is the signal to reach for a bitmask",
  ],
  status: "available",
};
