import type { Lesson } from "@/content/types";

export const numberBasesLesson: Lesson = {
  id: "dsa-math-bases",
  slug: "number-bases",
  moduleSlug: "number-systems-and-maths",
  title: "Decimal, Binary, Octal & Hexadecimal",
  summary:
    "What a base actually is, converting in both directions by hand and by library, and why hexadecimal exists at all.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Explain what a positional base is and convert between bases by hand",
    "Use the built-in conversions in both languages",
    "Say why binary and hexadecimal map onto each other so neatly",
    "Parse and format numbers in a given base",
  ],
  sections: [
    {
      id: "what-a-base-is",
      heading: "What a base is",
      body: [
        "In decimal, `407` means 4 × 10² + 0 × 10¹ + 7 × 10⁰. The digits are coefficients and the base decides the weights.",
        "Change the base and only the weights change. In binary, `1101` means 1 × 2³ + 1 × 2² + 0 × 2¹ + 1 × 2⁰ = 13. In hexadecimal, `d` is a single digit meaning 13, because base 16 needs sixteen digit symbols and borrows `a` to `f` for the last six.",
        "**A number does not have a base. A written representation does.** Thirteen is thirteen; `13`, `1101`, `15` and `d` are four ways of writing it. That distinction sounds pedantic and it removes most of the confusion in this topic.",
      ],
      examples: [
        {
          id: "same-number",
          title: "One number, four representations",
          lang: "python",
          code: `n = 13

print("decimal    :", n)
print("binary     :", bin(n))
print("octal      :", oct(n))
print("hexadecimal:", hex(n))

print("without prefixes:", f"{n:b}", f"{n:o}", f"{n:x}", f"{n:X}")
print("padded to 8 bits:", f"{n:08b}")

print("parsed back:", int("1101", 2), int("15", 8), int("d", 16), int("13"))
print("all the same number:", bin(n) == "0b1101" and int("d", 16) == n)`,
          output: `decimal    : 13
binary     : 0b1101
octal      : 0o15
hexadecimal: 0xd
without prefixes: 1101 15 d D
padded to 8 bits: 00001101
parsed back: 13 13 13 13
all the same number: True`,
          explanation:
            "`bin`, `oct` and `hex` include a prefix — `0b`, `0o`, `0x` — which marks the base in source code and is usually unwanted in output. The format specifiers give the bare digits, and `08b` pads to a fixed width, which is what you want when printing bit patterns so the columns line up.",
        },
      ],
      pitfalls: [
        {
          title: "Forgetting the base argument when parsing",
          body: "`int(\"1101\")` is one thousand one hundred and one; `int(\"1101\", 2)` is thirteen. The default base is 10 and there is no way for the function to guess. In Java it is `Integer.parseInt(s, 2)`, with the same default.",
        },
      ],
    },
    {
      id: "converting-by-hand",
      heading: "Converting by hand",
      body: [
        "Worth being able to do, because it appears in interviews and because it explains the digit-extraction technique used everywhere else in this module.",
        "**To decimal:** multiply each digit by its weight and add. `1101` in binary is 8 + 4 + 0 + 1 = 13.",
        "**From decimal:** repeatedly divide by the base and collect the remainders, then read them **backwards**. 13 ÷ 2 gives 6 remainder 1, then 3 remainder 0, then 1 remainder 1, then 0 remainder 1 — reading up, 1101.",
        "That second procedure is exactly the digit-extraction loop from the modulo lesson, with a base other than 10. `n % base` is the next digit and `n // base` removes it.",
      ],
      examples: [
        {
          id: "by-hand",
          title: "Both directions, implemented",
          lang: "python",
          code: `DIGITS = "0123456789abcdef"


def to_base(n, base):
    if n == 0:
        return "0"
    out = []
    while n > 0:
        out.append(DIGITS[n % base])
        n //= base
    return "".join(reversed(out))


def from_base(text, base):
    total = 0
    for ch in text:
        total = total * base + DIGITS.index(ch)
    return total


for base in (2, 8, 16):
    written = to_base(13, base)
    print(f"13 in base {base:>2}: {written:>5}   back again: {from_base(written, base)}")

print("zero:", to_base(0, 2))
print("255 in hex:", to_base(255, 16))
print("agrees with the library:", to_base(255, 16) == format(255, "x"))`,
          output: `13 in base  2:  1101   back again: 13
13 in base  8:    15   back again: 13
13 in base 16:     d   back again: 13
zero: 0
255 in hex: ff
agrees with the library: True
`,
          explanation:
            "`to_base` collects remainders and reverses, which is why the digits come out in the right order. `from_base` uses Horner's method — multiply the running total by the base and add the next digit — which is the same shape as the digit-building loop and avoids computing any powers. Note the explicit zero case: the `while n > 0` loop produces nothing for zero, so it needs its own answer.",
        },
      ],
    },
    {
      id: "why-hex",
      heading: "Why hexadecimal exists",
      body: [
        "Hex is not an arbitrary third option. It exists because **one hex digit is exactly four binary digits**, since 16 = 2⁴.",
        "So converting between binary and hex needs no arithmetic at all — you group the bits in fours and translate each group. `11111111` is `1111` `1111`, which is `f` `f`, which is `ff`.",
        "That makes hex a compact, lossless shorthand for bit patterns, which is why memory addresses, colours, hashes and bitmasks are all written in it. Octal has the same property with three bits and is largely a historical leftover, surviving mainly in Unix file permissions.",
      ],
      examples: [
        {
          id: "hex-groups",
          title: "Four bits at a time",
          lang: "python",
          code: `for value in (255, 4095, 48879):
    b = format(value, "b")
    padded = b.zfill((len(b) + 3) // 4 * 4)
    groups = [padded[i:i + 4] for i in range(0, len(padded), 4)]
    print(f"{value:>6}  {' '.join(groups)}  ->  {format(value, 'x')}")

print()
for digit in range(16):
    print(f"{format(digit, 'x')} = {format(digit, '04b')}", end="   ")
    if digit % 4 == 3:
        print()`,
          output: `   255  1111 1111  ->  ff
  4095  1111 1111 1111  ->  fff
 48879  1011 1110 1110 1111  ->  beef

0 = 0000   1 = 0001   2 = 0010   3 = 0011
4 = 0100   5 = 0101   6 = 0110   7 = 0111
8 = 1000   9 = 1001   a = 1010   b = 1011
c = 1100   d = 1101   e = 1110   f = 1111
`,
          explanation:
            "Each group of four bits maps to exactly one hex digit, with no carrying and no arithmetic — which is the whole reason hex is used. The lookup table at the bottom is worth glancing at until `f = 1111` and `8 = 1000` are instant; those two anchor the rest.",
        },
      ],
    },
    {
      id: "java-side",
      heading: "In Java",
      body: [
        "Java's conversions are static methods on the wrapper classes rather than global functions, and there is no prefix on the output.",
        "**To a base:** `Integer.toBinaryString`, `toOctalString`, `toHexString`, and the general `Integer.toString(n, base)`.",
        "**From a base:** `Integer.parseInt(s, base)`.",
        "Literals can be written in binary, octal and hex directly: `0b1101`, `015`, `0xd`. The octal form is a trap — a leading zero means octal, so `015` is 13 rather than 15.",
      ],
      examples: [
        {
          id: "java-bases",
          title: "The conversions, and the octal literal trap",
          lang: "java",
          code: `public class Main {
    public static void main(String[] args) {
        int n = 13;

        System.out.println(Integer.toBinaryString(n));
        System.out.println(Integer.toOctalString(n));
        System.out.println(Integer.toHexString(n));
        System.out.println(Integer.toString(n, 16));

        System.out.println(Integer.parseInt("1101", 2));
        System.out.println(Integer.parseInt("d", 16));

        System.out.println(0b1101 + " " + 0xd + " " + 015);
        System.out.println("a leading zero means octal: 015 is " + 015);

        System.out.println(Integer.toBinaryString(-5));
    }
}`,
          output: `1101
15
d
d
13
13
13 13 13
a leading zero means octal: 015 is 13
11111111111111111111111111111011`,
          explanation:
            "The last line is the important one: Java's `toBinaryString` on a negative number shows the raw 32-bit two's-complement pattern, all thirty-two bits. Python's `bin(-5)` gives `-0b101` instead — the sign and the magnitude — because its integers are unbounded and have no fixed width to show. Neither is wrong; they answer different questions, and mixing them up is confusing.",
        },
      ],
      pitfalls: [
        {
          title: "A leading zero in a Java integer literal",
          body: "`015` is octal and equals 13. This bites when formatting things like dates or times with padded literals — `int minute = 08;` does not even compile, because 8 is not an octal digit. Python 3 forbids the form entirely and requires `0o15`, which is the better design.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you convert a decimal number to binary by hand?",
      answer:
        "Repeatedly divide by 2 and collect the remainders, then read them in reverse. 13 gives remainders 1, 0, 1, 1 reading downward, so the binary is 1101. It is exactly the digit-extraction loop — `n % base` is the next digit and `n // base` removes it — with the base changed from 10 to 2. Going the other way, multiply each digit by its positional weight and add, or use Horner's method: running total times the base, plus the next digit.",
    },
    {
      question: "Why is hexadecimal used for bit patterns rather than decimal?",
      answer:
        "Because 16 is 2⁴, so one hex digit is exactly four bits and the conversion needs no arithmetic — you group the bits in fours and translate each group independently. That makes hex a compact and lossless shorthand for a bit pattern, which is why addresses, colours, hashes and masks all use it. Decimal has no such alignment, so a decimal digit does not correspond to any fixed number of bits.",
    },
    {
      question: "Why does `Integer.toBinaryString(-5)` show thirty-two ones and zeros while Python's `bin(-5)` shows `-0b101`?",
      answer:
        "Because they answer different questions. Java's `int` is a fixed 32 bits stored in two's complement, so the method shows the actual stored pattern. Python's integers are arbitrary-precision with no fixed width, so there is no bit pattern to show — it prints a sign and the magnitude in binary instead. To see a two's-complement pattern in Python you mask explicitly, as `-5 & 0xFFFFFFFF`.",
    },
  ],
  takeaways: [
    "A base sets the positional weights; a number does not have a base, a written form does",
    "`bin`, `oct`, `hex` include prefixes; format specifiers `b`, `o`, `x` give bare digits",
    "`int(s, base)` and `Integer.parseInt(s, base)` parse; the default base is always 10",
    "To convert from decimal: collect remainders of division by the base, then reverse",
    "Zero needs its own case, because the `while n > 0` loop produces nothing",
    "One hex digit is exactly four bits, which is why hex is the shorthand for bit patterns",
    "A leading zero in a Java literal means octal — `015` is 13",
    "Java shows negatives as a 32-bit two's-complement pattern; Python shows a sign and magnitude",
  ],
};
