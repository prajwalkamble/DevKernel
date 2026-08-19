import type { Lesson } from "@/content/types";

export const bitwiseOperatorsLesson: Lesson = {
  id: "dsa-ops-bitwise",
  slug: "bitwise-operators",
  moduleSlug: "operators-and-expressions",
  title: "Bitwise Operators, First Look",
  summary:
    "The six bit operators, the four one-line tricks worth memorising, and the third shift operator that exists only in Java.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Use `&`, `|`, `^`, `~`, `<<` and `>>` and predict their results",
    "Test, set, clear and toggle a single bit",
    "Explain the difference between `>>` and `>>>`",
    "Recognise the four standard bit tricks when you meet them in a solution",
  ],
  sections: [
    {
      id: "the-six",
      heading: "Six operators, on the bits",
      body: [
        "Every integer is a row of bits. These six operators work on those bits directly rather than on the value as a whole.",
        "**`&` and** — a bit is 1 only if both inputs have 1 there.",
        "**`|` or** — 1 if either does.",
        "**`^` xor** — 1 if exactly one does. Different bits give 1, identical bits give 0.",
        "**`~` not** — flips every bit. On a signed type this gives `-x - 1`, which surprises people.",
        "**`<<` left shift** — moves bits left, filling with zeros. Shifting left by k multiplies by 2ᵏ.",
        "**`>>` right shift** — moves bits right. Dividing by 2ᵏ, with a wrinkle on negatives covered below.",
      ],
      examples: [
        {
          id: "six-operators",
          title: "All six, with the binary shown",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int a = 5;
        int b = 3;

        System.out.println("a      = " + Integer.toBinaryString(a));
        System.out.println("b      = " + Integer.toBinaryString(b));
        System.out.println("a & b  = " + (a & b) + "  " + Integer.toBinaryString(a & b));
        System.out.println("a | b  = " + (a | b) + "  " + Integer.toBinaryString(a | b));
        System.out.println("a ^ b  = " + (a ^ b) + "  " + Integer.toBinaryString(a ^ b));
        System.out.println("~a     = " + (~a));
        System.out.println("a << 1 = " + (a << 1));
        System.out.println("a >> 1 = " + (a >> 1));
    }
}`,
          output: `a      = 101
b      = 11
a & b  = 1  1
a | b  = 7  111
a ^ b  = 6  110
~a     = -6
a << 1 = 10
a >> 1 = 2
`,
          explanation:
            "Work through `a & b` by hand: 101 and 011 share a 1 only in the last position, giving 001 — which is 1. `~5` being −6 follows from two's complement: flipping every bit of a signed integer gives exactly `-x - 1`, every time, which is worth remembering as a rule rather than re-deriving.",
        },
      ],
    },
    {
      id: "shifts",
      heading: "The three shifts",
      body: [
        "`<<` shifts left and fills with zeros. `x << k` is `x * 2ᵏ`, and it will overflow silently once the bits run off the top.",
        "`>>` shifts right and fills with **copies of the sign bit**, so negatives stay negative. This is arithmetic shift, and `x >> k` equals `Math.floorDiv(x, 2ᵏ)` — note *floor*, not truncation, so `-8 >> 1` is −4 and `-7 >> 1` is −4 as well.",
        "`>>>` shifts right and fills with **zeros**, ignoring the sign. This is logical shift, it exists only in Java, and it turns a negative into a large positive.",
        "Python has no `>>>` because its integers are unbounded and have no fixed-width sign bit to ignore — `>>` there always behaves as arithmetic shift.",
      ],
      examples: [
        {
          id: "shifts",
          title: "Where the two right shifts diverge",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int negative = -8;

        System.out.println("-8 >> 1  = " + (negative >> 1));
        System.out.println("-8 >>> 1 = " + (negative >>> 1));
        System.out.println("-7 >> 1  = " + (-7 >> 1));
        System.out.println("-7 / 2   = " + (-7 / 2));

        System.out.println("1 << 10  = " + (1 << 10));
        System.out.println("1 << 31  = " + (1 << 31));
        System.out.println("1L << 31 = " + (1L << 31));
    }
}`,
          output: `-8 >> 1  = -4
-8 >>> 1 = 2147483644
-7 >> 1  = -4
-7 / 2   = -3
1 << 10  = 1024
1 << 31  = -2147483648
1L << 31 = 2147483648`,
          explanation:
            "Two lessons in one output. `-7 >> 1` is −4 while `-7 / 2` is −3 — the shift floors and the division truncates, so they disagree on negatives and are *not* interchangeable. And `1 << 31` is negative because it has shifted a 1 into the sign bit of an `int`; `1L << 31` is the fix. Any bitmask over more than 31 items must use `long` and `1L`.",
        },
      ],
      pitfalls: [
        {
          title: "`1 << k` for k of 32 or more",
          body: "Java masks the shift amount to its low 5 bits for `int` (6 for `long`), so `1 << 32` is `1 << 0`, which is 1 — not 0, and not an error. A loop over 40 bits using `1 << i` silently wraps at 32 and produces nonsense. Use `1L << i` and the mask becomes 6 bits, up to 63.",
        },
      ],
    },
    {
      id: "single-bits",
      heading: "Testing, setting, clearing, toggling",
      body: [
        "The four operations on one bit. Each is one line and each is worth knowing by shape rather than by re-derivation.",
        "**Test:** `(x >> k) & 1` — or `(x & (1 << k)) != 0`.",
        "**Set:** `x | (1 << k)`.",
        "**Clear:** `x & ~(1 << k)`.",
        "**Toggle:** `x ^ (1 << k)`.",
        "Together these turn an integer into a set of up to 32 or 64 items, which is what bitmask problems are built on: subsets of a small collection, visited-state in a travelling-salesman DP, flags on a board.",
      ],
      examples: [
        {
          id: "bit-operations",
          title: "An integer as a set",
          lang: "python",
          code: `mask = 0

mask |= 1 << 2
mask |= 1 << 5
print(f"after setting bits 2 and 5: {mask} = {mask:08b}")

print("bit 2 set?", (mask >> 2) & 1 == 1)
print("bit 3 set?", (mask >> 3) & 1 == 1)

mask &= ~(1 << 2)
print(f"after clearing bit 2     : {mask} = {mask:08b}")

mask ^= 1 << 5
print(f"after toggling bit 5     : {mask} = {mask:08b}")

items = ["a", "b", "c"]
for subset in range(1 << len(items)):
    chosen = [items[i] for i in range(len(items)) if subset >> i & 1]
    print(f"{subset:03b} -> {chosen}")`,
          output: `after setting bits 2 and 5: 36 = 00100100
bit 2 set? True
bit 3 set? False
after clearing bit 2     : 32 = 00100000
after toggling bit 5     : 0 = 00000000
000 -> []
001 -> ['a']
010 -> ['b']
011 -> ['a', 'b']
100 -> ['c']
101 -> ['a', 'c']
110 -> ['b', 'c']
111 -> ['a', 'b', 'c']`,
          explanation:
            "The last block is the subset-enumeration idiom and it is one of the most useful things in this lesson: counting from 0 to 2ⁿ − 1 and reading each number's bits enumerates every subset exactly once. That is how you brute-force over subsets when the constraints say n ≤ 20, and recognising `1 << n` as \"the number of subsets\" is a real reading skill.",
        },
      ],
    },
    {
      id: "four-tricks",
      heading: "Four tricks worth memorising",
      body: [
        "**`n & 1`** — the last bit, so 1 for odd and 0 for even. Faster than `%` on very old hardware and identical on modern hardware, so use whichever reads better; `n % 2` usually does.",
        "**`n & (n - 1)`** — clears the lowest set bit. So `n & (n - 1) == 0` tests whether n is a power of two, and repeatedly applying it counts the set bits in as many steps as there are bits set.",
        "**`n & -n`** — isolates the lowest set bit. The basis of the Fenwick tree, and useful whenever you need to iterate set bits one at a time.",
        "**`a ^ a == 0` and `a ^ 0 == a`** — XOR is its own inverse. That is why XORing every element of an array where all values appear twice except one leaves exactly the odd one out, in O(n) time and O(1) space.",
      ],
      examples: [
        {
          id: "tricks",
          title: "The four, demonstrated",
          lang: "python",
          code: `n = 12
print(f"n           = {n:08b}")
print(f"n & 1       = {n & 1}   (even)" )
print(f"n & (n - 1) = {n & (n - 1):08b}  (lowest set bit cleared)")
print(f"n & -n      = {n & -n:08b}  (lowest set bit isolated)")

for candidate in [1, 2, 6, 8, 16, 18]:
    print(candidate, "power of two?", candidate > 0 and candidate & (candidate - 1) == 0)

values = [4, 1, 2, 1, 2]
unique = 0
for v in values:
    unique ^= v
print("the value appearing once:", unique)`,
          output: `n           = 00001100
n & 1       = 0   (even)
n & (n - 1) = 00001000  (lowest set bit cleared)
n & -n      = 00000100  (lowest set bit isolated)
1 power of two? True
2 power of two? True
6 power of two? False
8 power of two? True
16 power of two? True
18 power of two? False
the value appearing once: 4`,
          explanation:
            "The XOR block is the one to remember: five numbers, four of them in pairs, and XORing everything leaves the unpaired one — because each pair cancels to zero and zero XOR anything is that thing. No sorting, no map, one pass, constant space. It is the archetypal \"bit manipulation solves this in one line\" problem and it appears constantly.",
        },
      ],
      pitfalls: [
        {
          title: "Precedence of the bitwise operators",
          body: "`&`, `^` and `|` all bind *looser* than the comparison operators, so `x & 1 == 0` parses as `x & (1 == 0)` in Java — a type error — and in Python as `x & (1 == 0)`, which is `x & False`, silently wrong. Always bracket: `(x & 1) == 0`. This is one of the few places where precedence produces a genuinely surprising parse.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the difference between `>>` and `>>>` in Java?",
      answer:
        "`>>` is an arithmetic shift: it fills the vacated high bits with copies of the sign bit, so a negative number stays negative and the operation equals flooring division by a power of two. `>>>` is a logical shift: it fills with zeros regardless of sign, so `-8 >>> 1` becomes a large positive number. Python has no `>>>` because its integers are unbounded and have no fixed sign bit to ignore.",
    },
    {
      question: "How do you check whether a number is a power of two?",
      answer:
        "`n > 0 && (n & (n - 1)) == 0`. Subtracting one from a power of two flips its single set bit to zero and sets every bit below it, so the AND is zero. The `n > 0` guard matters because zero also passes the AND test and is not a power of two, and because a negative number in two's complement would give a misleading answer. The same expression applied repeatedly counts set bits in one step per set bit.",
    },
    {
      question: "How would you find the single number in an array where every other value appears twice?",
      answer:
        "XOR everything together. XOR is commutative and associative, `a ^ a` is 0 and `a ^ 0` is `a`, so every pair cancels and the unpaired value survives. That is O(n) time and O(1) space, against O(n) space for a hash set or O(n log n) for sorting. It relies entirely on every other value appearing an even number of times, which is exactly what the statement guarantees.",
    },
  ],
  takeaways: [
    "Six operators: `&`, `|`, `^`, `~`, `<<`, `>>` — plus Java's `>>>`",
    "`~x` is `-x - 1` on a signed type, every time",
    "`>>` fills with the sign bit and floors; `>>>` fills with zeros and exists only in Java",
    "`-7 >> 1` is −4 while `-7 / 2` is −3 — shifting and dividing are not interchangeable on negatives",
    "`1 << 31` overflows an `int`; use `1L << k` for any mask beyond 31 bits",
    "Java masks the shift amount, so `1 << 32` is 1 rather than 0 or an error",
    "Test, set, clear, toggle: `(x >> k) & 1`, `x | (1 << k)`, `x & ~(1 << k)`, `x ^ (1 << k)`",
    "`n & (n - 1)` clears the lowest set bit; `n & -n` isolates it; XOR cancels pairs",
    "Bitwise operators bind looser than comparisons — always bracket `(x & 1) == 0`",
  ],
};
