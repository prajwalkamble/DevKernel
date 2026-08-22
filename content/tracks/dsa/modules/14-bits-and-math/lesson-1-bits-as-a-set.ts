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
          alternates: [
            {
              lang: "javascript",
              code: `const show = (n, width = 8) => (n >>> 0).toString(2).padStart(width, "0").slice(-width);

let mask = 0;
console.log("start          ", show(mask));

// set bit i
for (const i of [0, 2, 5]) {
  mask |= 1 << i;
  console.log(\`set bit \${i}      \`, show(mask));
}

// test bit i
for (const i of [2, 3]) {
  console.log(\`test bit \${i}     \`, ((mask >> i) & 1) === 1);
}

// clear bit 2
mask &= ~(1 << 2);
console.log("clear bit 2    ", show(mask));

// toggle bit 0
mask ^= 1 << 0;
console.log("toggle bit 0   ", show(mask));

// lowest set bit
const m = 0b10110000;
console.log();
console.log("m              ", show(m));
console.log("m & -m         ", show(m & -m), " <- isolates the lowest set bit");
console.log("m & (m-1)      ", show(m & (m - 1)), " <- clears the lowest set bit");
console.log("popcount       ", m.toString(2).split("").filter((c) => c === "1").length);

// counting bits by clearing the lowest, one iteration per set bit
let n = m;
let count = 0;
while (n) {
  n &= n - 1;
  count++;
}
console.log("kernighan count", count);`,
              output: `start           00000000
set bit 0       00000001
set bit 2       00000101
set bit 5       00100101
test bit 2      true
test bit 3      false
clear bit 2     00100001
toggle bit 0    00100000

m               10110000
m & -m          00010000  <- isolates the lowest set bit
m & (m-1)       10100000  <- clears the lowest set bit
popcount        3
kernighan count 3`,
            },
            {
              lang: "typescript",
              code: `const show = (n: number, width = 8): string => (n >>> 0).toString(2).padStart(width, "0").slice(-width);

let mask = 0;
console.log("start          ", show(mask));

// set bit i
for (const i of [0, 2, 5]) {
  mask |= 1 << i;
  console.log(\`set bit \${i}      \`, show(mask));
}

// test bit i
for (const i of [2, 3]) {
  console.log(\`test bit \${i}     \`, ((mask >> i) & 1) === 1);
}

// clear bit 2
mask &= ~(1 << 2);
console.log("clear bit 2    ", show(mask));

// toggle bit 0
mask ^= 1 << 0;
console.log("toggle bit 0   ", show(mask));

// lowest set bit
const m = 0b10110000;
console.log();
console.log("m              ", show(m));
console.log("m & -m         ", show(m & -m), " <- isolates the lowest set bit");
console.log("m & (m-1)      ", show(m & (m - 1)), " <- clears the lowest set bit");
console.log("popcount       ", m.toString(2).split("").filter((c) => c === "1").length);

// counting bits by clearing the lowest, one iteration per set bit
let n = m;
let count = 0;
while (n) {
  n &= n - 1;
  count++;
}
console.log("kernighan count", count);`,
              output: `start           00000000
set bit 0       00000001
set bit 2       00000101
set bit 5       00100101
test bit 2      true
test bit 3      false
clear bit 2     00100001
toggle bit 0    00100000

m               10110000
m & -m          00010000  <- isolates the lowest set bit
m & (m-1)       10100000  <- clears the lowest set bit
popcount        3
kernighan count 3`,
            },
            {
              lang: "java",
              code: `public class Main {
    static String show(int n, int width) {
        String s = Integer.toBinaryString(n);
        if (s.length() > width) s = s.substring(s.length() - width);
        return "0".repeat(width - s.length()) + s;
    }

    static String show(int n) {
        return show(n, 8);
    }

    public static void main(String[] args) {
        int mask = 0;
        System.out.println("start           " + show(mask));

        // set bit i
        for (int i : new int[]{0, 2, 5}) {
            mask |= 1 << i;
            System.out.println("set bit " + i + "       " + show(mask));
        }

        // test bit i
        for (int i : new int[]{2, 3}) {
            System.out.println("test bit " + i + "      " + (((mask >> i) & 1) == 1));
        }

        // clear bit 2
        mask &= ~(1 << 2);
        System.out.println("clear bit 2     " + show(mask));

        // toggle bit 0
        mask ^= 1 << 0;
        System.out.println("toggle bit 0    " + show(mask));

        // lowest set bit
        int m = 0b10110000;
        System.out.println();
        System.out.println("m               " + show(m));
        System.out.println("m & -m          " + show(m & -m) + "  <- isolates the lowest set bit");
        System.out.println("m & (m-1)       " + show(m & (m - 1)) + "  <- clears the lowest set bit");
        System.out.println("popcount        " + Integer.bitCount(m));

        // counting bits by clearing the lowest, one iteration per set bit
        int n = m, count = 0;
        while (n != 0) {
            n &= n - 1;
            count++;
        }
        System.out.println("kernighan count " + count);
    }
}`,
              output: `start           00000000
set bit 0       00000001
set bit 2       00000101
set bit 5       00100101
test bit 2      true
test bit 3      false
clear bit 2     00100001
toggle bit 0    00100000

m               10110000
m & -m          00010000  <- isolates the lowest set bit
m & (m-1)       10100000  <- clears the lowest set bit
popcount        3
kernighan count 3`,
            },
            {
              lang: "cpp",
              code: `#include <bitset>
#include <iostream>
#include <string>
using namespace std;

string show(unsigned n, int width = 8) {
    string s = bitset<32>(n).to_string();
    return s.substr(s.size() - width);
}

int main() {
    int mask = 0;
    cout << "start           " << show(mask) << "\\n";

    // set bit i
    for (int i : {0, 2, 5}) {
        mask |= 1 << i;
        cout << "set bit " << i << "       " << show(mask) << "\\n";
    }

    // test bit i
    for (int i : {2, 3}) {
        cout << "test bit " << i << "      " << boolalpha << (((mask >> i) & 1) == 1) << "\\n";
    }

    // clear bit 2
    mask &= ~(1 << 2);
    cout << "clear bit 2     " << show(mask) << "\\n";

    // toggle bit 0
    mask ^= 1 << 0;
    cout << "toggle bit 0    " << show(mask) << "\\n";

    // lowest set bit
    int m = 0b10110000;
    cout << "\\n";
    cout << "m               " << show(m) << "\\n";
    cout << "m & -m          " << show(m & -m) << "  <- isolates the lowest set bit\\n";
    cout << "m & (m-1)       " << show(m & (m - 1)) << "  <- clears the lowest set bit\\n";
    cout << "popcount        " << bitset<32>(m).count() << "\\n";

    // counting bits by clearing the lowest, one iteration per set bit
    int n = m, count = 0;
    while (n) {
        n &= n - 1;
        count++;
    }
    cout << "kernighan count " << count << "\\n";
}`,
              output: `start           00000000
set bit 0       00000001
set bit 2       00000101
set bit 5       00100101
test bit 2      true
test bit 3      false
clear bit 2     00100001
toggle bit 0    00100000

m               10110000
m & -m          00010000  <- isolates the lowest set bit
m & (m-1)       10100000  <- clears the lowest set bit
popcount        3
kernighan count 3`,
            },
            {
              lang: "rust",
              code: `fn show(n: i32, width: usize) -> String {
    let s = format!("{:032b}", n as u32);
    s[s.len() - width..].to_string()
}

fn main() {
    let mut mask: i32 = 0;
    println!("start           {}", show(mask, 8));

    // set bit i
    for i in [0, 2, 5] {
        mask |= 1 << i;
        println!("set bit {}       {}", i, show(mask, 8));
    }

    // test bit i
    for i in [2, 3] {
        println!("test bit {}      {}", i, (mask >> i) & 1 == 1);
    }

    // clear bit 2
    mask &= !(1 << 2);
    println!("clear bit 2     {}", show(mask, 8));

    // toggle bit 0
    mask ^= 1 << 0;
    println!("toggle bit 0    {}", show(mask, 8));

    // lowest set bit
    let m: i32 = 0b1011_0000;
    println!();
    println!("m               {}", show(m, 8));
    // \`-m\` on i32::MIN would overflow, so the isolate uses a wrapping negate.
    println!("m & -m          {}  <- isolates the lowest set bit", show(m & m.wrapping_neg(), 8));
    println!("m & (m-1)       {}  <- clears the lowest set bit", show(m & (m - 1), 8));
    println!("popcount        {}", m.count_ones());

    // counting bits by clearing the lowest, one iteration per set bit
    let (mut n, mut count) = (m, 0);
    while n != 0 {
        n &= n - 1;
        count += 1;
    }
    println!("kernighan count {}", count);
}`,
              output: `start           00000000
set bit 0       00000001
set bit 2       00000101
set bit 5       00100101
test bit 2      true
test bit 3      false
clear bit 2     00100001
toggle bit 0    00100000

m               10110000
m & -m          00010000  <- isolates the lowest set bit
m & (m-1)       10100000  <- clears the lowest set bit
popcount        3
kernighan count 3`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"math/bits"
)

func show(n int32, width int) string {
	s := fmt.Sprintf("%032b", uint32(n))
	return s[len(s)-width:]
}

func main() {
	var mask int32 = 0
	fmt.Println("start          ", show(mask, 8))

	// set bit i
	for _, i := range []int{0, 2, 5} {
		mask |= 1 << i
		fmt.Printf("set bit %d       %s\\n", i, show(mask, 8))
	}

	// test bit i
	for _, i := range []int{2, 3} {
		fmt.Printf("test bit %d      %t\\n", i, (mask>>i)&1 == 1)
	}

	// clear bit 2
	mask &^= 1 << 2
	fmt.Println("clear bit 2    ", show(mask, 8))

	// toggle bit 0
	mask ^= 1 << 0
	fmt.Println("toggle bit 0   ", show(mask, 8))

	// lowest set bit
	var m int32 = 0b10110000
	fmt.Println()
	fmt.Println("m              ", show(m, 8))
	fmt.Println("m & -m         ", show(m&-m, 8), " <- isolates the lowest set bit")
	fmt.Println("m & (m-1)      ", show(m&(m-1), 8), " <- clears the lowest set bit")
	fmt.Println("popcount       ", bits.OnesCount32(uint32(m)))

	// counting bits by clearing the lowest, one iteration per set bit
	n, count := m, 0
	for n != 0 {
		n &= n - 1
		count++
	}
	fmt.Println("kernighan count", count)
}`,
              output: `start           00000000
set bit 0       00000001
set bit 2       00000101
set bit 5       00100101
test bit 2      true
test bit 3      false
clear bit 2     00100001
toggle bit 0    00100000

m               10110000
m & -m          00010000  <- isolates the lowest set bit
m & (m-1)       10100000  <- clears the lowest set bit
popcount        3
kernighan count 3`,
            },
            {
              lang: "asm",
              code: `; The same operations, at the level where they stop being metaphors.
;
; Every line the Python version writes as an operator is one instruction here:
; \`mask |= 1 << i\` is \`bts\`, \`mask &= ~(1 << i)\` is \`btr\`, \`mask ^= 1 << i\` is
; \`btc\`, and the two famous tricks — m & -m and m & (m-1) — are \`blsi\` and
; \`blsr\`, single instructions that exist precisely because they are common.
;
; \`m\` lives in r14 rather than r11 on purpose: the \`syscall\` instruction
; clobbers rcx and r11, so a value parked in r11 does not survive the first
; write. That is the kind of detail this level makes you deal with.
;
; nasm -f elf64 main.asm && ld -o main main.o

section .data
    lbl_mask  db "mask     ", 0
    lbl_isol  db "m & -m   ", 0
    lbl_clr   db "m & (m-1)", 0
    lbl_pop   db "popcount ", 0
    space     db " "
    newline   db 10

section .bss
    buf resb 16

section .text
    global _start

; write rsi, length rdx, to stdout
write:
    mov rax, 1
    mov rdi, 1
    syscall
    ret

; print the NUL-terminated string at rsi
puts:
    mov rdx, 0
.count:
    cmp byte [rsi + rdx], 0
    je .out
    inc rdx
    jmp .count
.out:
    call write
    ret

; print r8b as eight binary digits, then a newline
putbin:
    mov r12, 8
    mov r13, buf
.next:
    dec r12
    mov al, r8b
    mov rcx, r12          ; cl is the bit index, 7 down to 0
    shr al, cl
    and al, 1
    add al, '0'
    mov [r13], al
    inc r13
    test r12, r12
    jnz .next
    mov byte [r13], 10
    mov rsi, buf
    mov rdx, 9
    call write
    ret

; print rax as a single decimal digit, then a newline
putdigit:
    add al, '0'
    mov [buf], al
    mov byte [buf + 1], 10
    mov rsi, buf
    mov rdx, 2
    call write
    ret

_start:
    xor r9, r9                  ; the mask

    bts r9, 0                   ; set bit 0
    bts r9, 2                   ; set bit 2
    bts r9, 5                   ; set bit 5
    btr r9, 2                   ; clear bit 2
    btc r9, 0                   ; toggle bit 0

    mov rsi, lbl_mask
    call puts
    mov rsi, space
    mov rdx, 1
    call write
    mov r8, r9
    call putbin

    mov r14, 10110000b          ; m

    mov rsi, lbl_isol
    call puts
    mov rsi, space
    mov rdx, 1
    call write
    blsi r10, r14               ; m & -m
    mov r8, r10
    call putbin

    mov rsi, lbl_clr
    call puts
    mov rsi, space
    mov rdx, 1
    call write
    blsr r10, r14               ; m & (m - 1)
    mov r8, r10
    call putbin

    mov rsi, lbl_pop
    call puts
    mov rsi, space
    mov rdx, 1
    call write
    popcnt rax, r14             ; also one instruction
    call putdigit

    mov rax, 60                 ; exit(0)
    xor rdi, rdi
    syscall`,
              output: `mask      00100000
m & -m    00010000
m & (m-1) 10100000
popcount  3`,
            },
          ],
        },
      ],
      visual: {
        id: "bitops-visual",
        kind: "bits-and-math",
        algorithm: "bitops",
        lockAlgorithm: true,
        title: "One mask under all five operations",
      },
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
