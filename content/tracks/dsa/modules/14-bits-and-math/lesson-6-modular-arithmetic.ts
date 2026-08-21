import type { Lesson } from "@/content/types";

export const modularArithmeticLesson: Lesson = {
  id: "dsa-math-modular",
  slug: "modular-arithmetic-and-fast-exponentiation",
  moduleSlug: "bit-manipulation-and-math",
  title: "Modular Arithmetic, Fast Exponentiation & Inverses",
  summary:
    "Why so many problems end with \"modulo 10^9 + 7\", the three operations that survive a modulus and the one that does not, exponentiation in 60 steps instead of a quintillion, and the overflow that produces a wrong answer rather than a crash.",
  estimatedMinutes: 35,
  objectives: [
    "Explain why competitive problems ask for an answer modulo a large prime",
    "Apply the modulus early and often, and know which operations allow it",
    "Implement fast exponentiation and state its complexity",
    "Compute a modular inverse with Fermat's little theorem",
    "Handle negative remainders and multiplication overflow correctly",
  ],
  sections: [
    {
      id: "why",
      heading: "Why \"modulo 10^9 + 7\"",
      body: [
        "It appears so often that it stops looking like a choice. It is one.",
        "Counting problems produce enormous answers — the number of paths through a grid, or of valid arrangements, outgrows any fixed-width integer almost immediately. The setter has three options: require big integers, which makes the problem about your language's bignum library; ask for the answer modulo something, which keeps every intermediate value small; or restrict the input until the answer fits, which usually ruins the problem.",
        "The second is chosen. And the modulus is `10^9 + 7` because it is **prime**, which makes division possible through modular inverses, and because it is just under `2^30`, so a product of two residues fits comfortably in a 64-bit integer with room to spare.",
      ],
    },
    {
      id: "rules",
      heading: "What survives the modulus, and what does not",
      body: [
        "Addition, subtraction and multiplication all distribute over the modulus. You may reduce at any point without changing the answer, which is the whole point — it keeps every intermediate value bounded.",
        "**Division does not.** `(a / b) mod m` is not `(a mod m) / (b mod m)`, and no amount of care with parentheses fixes it. Division needs a modular inverse, which is the second half of this lesson.",
      ],
      examples: [
        {
          id: "modular",
          title: "The rules, fast exponentiation, and the inverse",
          lang: "python",
          code: `MOD = 10**9 + 7

# the rules that survive a modulus
a, b = 123456789, 987654321
print("(a+b) % M ==", (a + b) % MOD, "==", ((a % MOD) + (b % MOD)) % MOD)
print("(a*b) % M ==", (a * b) % MOD, "==", ((a % MOD) * (b % MOD)) % MOD)

# ...and the one that does not
print("\\ndivision does NOT distribute:")
print("  (10 // 2) % 7 =", (10 // 2) % 7)
print("  (10 % 7) // (2 % 7) =", (10 % 7) // (2 % 7), " <- wrong")

def power(base, exp, mod):
    """Fast exponentiation: square the base, halve the exponent."""
    result = 1
    base %= mod
    while exp > 0:
        if exp & 1:
            result = result * base % mod
        base = base * base % mod
        exp >>= 1
    return result

print("\\n2^10        =", power(2, 10, MOD))
print("3^1000000 mod M =", power(3, 1000000, MOD))
print("steps for exp=1e18:", (10**18).bit_length(), "iterations, not 1e18")

# modular inverse via Fermat: a^(p-2) is a^-1 when p is prime
def inverse(a, mod):
    return power(a, mod - 2, mod)

inv2 = inverse(2, MOD)
print("\\ninverse of 2 =", inv2)
print("2 * inv2 % M =", 2 * inv2 % MOD)
print("10/2 the modular way:", 10 * inv2 % MOD)

# negative values need care in languages that keep the sign
print("\\n-5 % 7 in Python:", -5 % 7)`,
          output: `(a+b) % M == 111111103 == 111111103
(a*b) % M == 259106859 == 259106859

division does NOT distribute:
  (10 // 2) % 7 = 5
  (10 % 7) // (2 % 7) = 1  <- wrong

2^10        = 1024
3^1000000 mod M = 64935414
steps for exp=1e18: 60 iterations, not 1e18

inverse of 2 = 500000004
2 * inv2 % M = 1
10/2 the modular way: 5

-5 % 7 in Python: 2`,
          explanation:
            "**Fast exponentiation** is the binary representation of the exponent, used directly: square the base at every step, and multiply it into the result whenever the corresponding bit is set. The exponent halves each iteration, so the cost is the *bit length* — sixty steps for an exponent of 10^18, not 10^18 steps.\n\n**The inverse** uses Fermat's little theorem: for a prime `p` and `a` not divisible by it, `a^(p-1) ≡ 1`, so `a^(p-2)` is the inverse. The check `2 * inv2 % M == 1` is what \"inverse\" means, and `10 * inv2 % M == 5` shows division working correctly through multiplication.",
          alternates: [
            {
              lang: "javascript",
              code: `// BigInt throughout: a*b here reaches 1.2e17 and base*base reaches 1e18, both
// past 2^53, so a plain Number would silently lose the low digits.
const MOD = 10n ** 9n + 7n;

// the rules that survive a modulus
const a = 123456789n;
const b = 987654321n;
console.log("(a+b) % M ==", String((a + b) % MOD), "==", String(((a % MOD) + (b % MOD)) % MOD));
console.log("(a*b) % M ==", String((a * b) % MOD), "==", String(((a % MOD) * (b % MOD)) % MOD));

// ...and the one that does not
console.log("\\ndivision does NOT distribute:");
console.log("  (10 // 2) % 7 =", (10 / 2) % 7);
console.log("  (10 % 7) // (2 % 7) =", Math.floor((10 % 7) / (2 % 7)), " <- wrong");

// Fast exponentiation: square the base, halve the exponent.
function power(base, exp, mod) {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

console.log("\\n2^10        =", String(power(2n, 10n, MOD)));
console.log("3^1000000 mod M =", String(power(3n, 1000000n, MOD)));
console.log("steps for exp=1e18:", (10n ** 18n).toString(2).length, "iterations, not 1e18");

// modular inverse via Fermat: a^(p-2) is a^-1 when p is prime
function inverse(a, mod) {
  return power(a, mod - 2n, mod);
}

const inv2 = inverse(2n, MOD);
console.log("\\ninverse of 2 =", String(inv2));
console.log("2 * inv2 % M =", String((2n * inv2) % MOD));
console.log("10/2 the modular way:", String((10n * inv2) % MOD));

// negative values need care in languages that keep the sign
console.log("\\n-5 % 7 in JavaScript:", -5 % 7);`,
              output: `(a+b) % M == 111111103 == 111111103
(a*b) % M == 259106859 == 259106859

division does NOT distribute:
  (10 // 2) % 7 = 5
  (10 % 7) // (2 % 7) = 1  <- wrong

2^10        = 1024
3^1000000 mod M = 64935414
steps for exp=1e18: 60 iterations, not 1e18

inverse of 2 = 500000004
2 * inv2 % M = 1
10/2 the modular way: 5

-5 % 7 in JavaScript: -5`,
            },
            {
              lang: "typescript",
              code: `// BigInt throughout: a*b here reaches 1.2e17 and base*base reaches 1e18, both
// past 2^53, so a plain Number would silently lose the low digits.
const MOD = 10n ** 9n + 7n;

// the rules that survive a modulus
const a = 123456789n;
const b = 987654321n;
console.log("(a+b) % M ==", String((a + b) % MOD), "==", String(((a % MOD) + (b % MOD)) % MOD));
console.log("(a*b) % M ==", String((a * b) % MOD), "==", String(((a % MOD) * (b % MOD)) % MOD));

// ...and the one that does not
console.log("\\ndivision does NOT distribute:");
console.log("  (10 // 2) % 7 =", (10 / 2) % 7);
console.log("  (10 % 7) // (2 % 7) =", Math.floor((10 % 7) / (2 % 7)), " <- wrong");

// Fast exponentiation: square the base, halve the exponent.
function power(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

console.log("\\n2^10        =", String(power(2n, 10n, MOD)));
console.log("3^1000000 mod M =", String(power(3n, 1000000n, MOD)));
console.log("steps for exp=1e18:", (10n ** 18n).toString(2).length, "iterations, not 1e18");

// modular inverse via Fermat: a^(p-2) is a^-1 when p is prime
function inverse(a: bigint, mod: bigint): bigint {
  return power(a, mod - 2n, mod);
}

const inv2 = inverse(2n, MOD);
console.log("\\ninverse of 2 =", String(inv2));
console.log("2 * inv2 % M =", String((2n * inv2) % MOD));
console.log("10/2 the modular way:", String((10n * inv2) % MOD));

// negative values need care in languages that keep the sign
console.log("\\n-5 % 7 in TypeScript:", -5 % 7);`,
              output: `(a+b) % M == 111111103 == 111111103
(a*b) % M == 259106859 == 259106859

division does NOT distribute:
  (10 // 2) % 7 = 5
  (10 % 7) // (2 % 7) = 1  <- wrong

2^10        = 1024
3^1000000 mod M = 64935414
steps for exp=1e18: 60 iterations, not 1e18

inverse of 2 = 500000004
2 * inv2 % M = 1
10/2 the modular way: 5

-5 % 7 in TypeScript: -5`,
            },
            {
              lang: "java",
              code: `public class Main {
    static final long MOD = 1_000_000_007L;

    /** Fast exponentiation: square the base, halve the exponent. */
    static long power(long base, long exp, long mod) {
        long result = 1;
        base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) result = result * base % mod;
            base = base * base % mod;
            exp >>= 1;
        }
        return result;
    }

    /** modular inverse via Fermat: a^(p-2) is a^-1 when p is prime */
    static long inverse(long a, long mod) {
        return power(a, mod - 2, mod);
    }

    public static void main(String[] args) {
        // the rules that survive a modulus. long, not int: a*b reaches 1.2e17.
        long a = 123456789L, b = 987654321L;
        System.out.println("(a+b) % M == " + (a + b) % MOD
                + " == " + ((a % MOD) + (b % MOD)) % MOD);
        System.out.println("(a*b) % M == " + (a * b) % MOD
                + " == " + ((a % MOD) * (b % MOD)) % MOD);

        // ...and the one that does not
        System.out.println("\\ndivision does NOT distribute:");
        System.out.println("  (10 // 2) % 7 = " + (10 / 2) % 7);
        System.out.println("  (10 % 7) // (2 % 7) = " + (10 % 7) / (2 % 7) + "  <- wrong");

        System.out.println("\\n2^10        = " + power(2, 10, MOD));
        System.out.println("3^1000000 mod M = " + power(3, 1_000_000, MOD));
        System.out.println("steps for exp=1e18: "
                + (64 - Long.numberOfLeadingZeros(1_000_000_000_000_000_000L))
                + " iterations, not 1e18");

        long inv2 = inverse(2, MOD);
        System.out.println("\\ninverse of 2 = " + inv2);
        System.out.println("2 * inv2 % M = " + 2 * inv2 % MOD);
        System.out.println("10/2 the modular way: " + 10 * inv2 % MOD);

        // negative values need care in languages that keep the sign
        System.out.println("\\n-5 % 7 in Java: " + (-5 % 7));
    }
}`,
              output: `(a+b) % M == 111111103 == 111111103
(a*b) % M == 259106859 == 259106859

division does NOT distribute:
  (10 // 2) % 7 = 5
  (10 % 7) // (2 % 7) = 1  <- wrong

2^10        = 1024
3^1000000 mod M = 64935414
steps for exp=1e18: 60 iterations, not 1e18

inverse of 2 = 500000004
2 * inv2 % M = 1
10/2 the modular way: 5

-5 % 7 in Java: -5`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
using namespace std;

const long long MOD = 1000000007LL;

// Fast exponentiation: square the base, halve the exponent.
long long power(long long base, long long exp, long long mod) {
    long long result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) result = result * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}

// modular inverse via Fermat: a^(p-2) is a^-1 when p is prime
long long inverse(long long a, long long mod) { return power(a, mod - 2, mod); }

int main() {
    // the rules that survive a modulus. long long, not int: a*b reaches 1.2e17.
    long long a = 123456789LL, b = 987654321LL;
    cout << "(a+b) % M == " << (a + b) % MOD
         << " == " << ((a % MOD) + (b % MOD)) % MOD << "\\n";
    cout << "(a*b) % M == " << (a * b) % MOD
         << " == " << ((a % MOD) * (b % MOD)) % MOD << "\\n";

    // ...and the one that does not
    cout << "\\ndivision does NOT distribute:\\n";
    cout << "  (10 // 2) % 7 = " << (10 / 2) % 7 << "\\n";
    cout << "  (10 % 7) // (2 % 7) = " << (10 % 7) / (2 % 7) << "  <- wrong\\n";

    cout << "\\n2^10        = " << power(2, 10, MOD) << "\\n";
    cout << "3^1000000 mod M = " << power(3, 1000000, MOD) << "\\n";
    cout << "steps for exp=1e18: " << 64 - __builtin_clzll(1000000000000000000LL)
         << " iterations, not 1e18\\n";

    long long inv2 = inverse(2, MOD);
    cout << "\\ninverse of 2 = " << inv2 << "\\n";
    cout << "2 * inv2 % M = " << 2 * inv2 % MOD << "\\n";
    cout << "10/2 the modular way: " << 10 * inv2 % MOD << "\\n";

    // negative values need care in languages that keep the sign
    cout << "\\n-5 % 7 in C++: " << -5 % 7 << "\\n";
}`,
              output: `(a+b) % M == 111111103 == 111111103
(a*b) % M == 259106859 == 259106859

division does NOT distribute:
  (10 // 2) % 7 = 5
  (10 % 7) // (2 % 7) = 1  <- wrong

2^10        = 1024
3^1000000 mod M = 64935414
steps for exp=1e18: 60 iterations, not 1e18

inverse of 2 = 500000004
2 * inv2 % M = 1
10/2 the modular way: 5

-5 % 7 in C++: -5`,
            },
            {
              lang: "rust",
              code: `const MOD: i64 = 1_000_000_007;

/// Fast exponentiation: square the base, halve the exponent.
fn power(mut base: i64, mut exp: i64, mod_: i64) -> i64 {
    let mut result: i64 = 1;
    base %= mod_;
    while exp > 0 {
        if exp & 1 == 1 {
            result = result * base % mod_;
        }
        base = base * base % mod_;
        exp >>= 1;
    }
    result
}

/// modular inverse via Fermat: a^(p-2) is a^-1 when p is prime
fn inverse(a: i64, mod_: i64) -> i64 {
    power(a, mod_ - 2, mod_)
}

fn main() {
    // the rules that survive a modulus. i64, not i32: a*b reaches 1.2e17.
    let (a, b) = (123_456_789i64, 987_654_321i64);
    println!("(a+b) % M == {} == {}", (a + b) % MOD, ((a % MOD) + (b % MOD)) % MOD);
    println!("(a*b) % M == {} == {}", (a * b) % MOD, ((a % MOD) * (b % MOD)) % MOD);

    // ...and the one that does not
    println!("\\ndivision does NOT distribute:");
    println!("  (10 // 2) % 7 = {}", (10 / 2) % 7);
    println!("  (10 % 7) // (2 % 7) = {}  <- wrong", (10 % 7) / (2 % 7));

    println!("\\n2^10        = {}", power(2, 10, MOD));
    println!("3^1000000 mod M = {}", power(3, 1_000_000, MOD));
    println!(
        "steps for exp=1e18: {} iterations, not 1e18",
        64 - 1_000_000_000_000_000_000i64.leading_zeros()
    );

    let inv2 = inverse(2, MOD);
    println!("\\ninverse of 2 = {}", inv2);
    println!("2 * inv2 % M = {}", 2 * inv2 % MOD);
    println!("10/2 the modular way: {}", 10 * inv2 % MOD);

    // negative values need care in languages that keep the sign
    println!("\\n-5 % 7 in Rust: {}", -5 % 7);
}`,
              output: `(a+b) % M == 111111103 == 111111103
(a*b) % M == 259106859 == 259106859

division does NOT distribute:
  (10 // 2) % 7 = 5
  (10 % 7) // (2 % 7) = 1  <- wrong

2^10        = 1024
3^1000000 mod M = 64935414
steps for exp=1e18: 60 iterations, not 1e18

inverse of 2 = 500000004
2 * inv2 % M = 1
10/2 the modular way: 5

-5 % 7 in Rust: -5`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"math/bits"
)

const MOD int64 = 1_000_000_007

// Fast exponentiation: square the base, halve the exponent.
func power(base, exp, mod int64) int64 {
	var result int64 = 1
	base %= mod
	for exp > 0 {
		if exp&1 == 1 {
			result = result * base % mod
		}
		base = base * base % mod
		exp >>= 1
	}
	return result
}

// modular inverse via Fermat: a^(p-2) is a^-1 when p is prime
func inverse(a, mod int64) int64 { return power(a, mod-2, mod) }

func main() {
	// the rules that survive a modulus. int64: a*b reaches 1.2e17.
	var a, b int64 = 123456789, 987654321
	fmt.Println("(a+b) % M ==", (a+b)%MOD, "==", ((a%MOD)+(b%MOD))%MOD)
	fmt.Println("(a*b) % M ==", (a*b)%MOD, "==", ((a%MOD)*(b%MOD))%MOD)

	// ...and the one that does not
	fmt.Println("\\ndivision does NOT distribute:")
	fmt.Println("  (10 // 2) % 7 =", (10/2)%7)
	fmt.Println("  (10 % 7) // (2 % 7) =", (10%7)/(2%7), " <- wrong")

	fmt.Println("\\n2^10        =", power(2, 10, MOD))
	fmt.Println("3^1000000 mod M =", power(3, 1000000, MOD))
	fmt.Println("steps for exp=1e18:", bits.Len64(1000000000000000000), "iterations, not 1e18")

	inv2 := inverse(2, MOD)
	fmt.Println("\\ninverse of 2 =", inv2)
	fmt.Println("2 * inv2 % M =", 2*inv2%MOD)
	fmt.Println("10/2 the modular way:", 10*inv2%MOD)

	// negative values need care in languages that keep the sign
	fmt.Println("\\n-5 % 7 in Go:", -5%7)
}`,
              output: `(a+b) % M == 111111103 == 111111103
(a*b) % M == 259106859 == 259106859

division does NOT distribute:
  (10 // 2) % 7 = 5
  (10 % 7) // (2 % 7) = 1  <- wrong

2^10        = 1024
3^1000000 mod M = 64935414
steps for exp=1e18: 60 iterations, not 1e18

inverse of 2 = 500000004
2 * inv2 % M = 1
10/2 the modular way: 5

-5 % 7 in Go: -5`,
            },
          ],
        },
      ],
    },
    {
      id: "java-traps",
      heading: "Two traps that do not exist in Python",
      body: [
        "Python's integers are unbounded and its `%` always returns a non-negative result for a positive modulus. Neither is true in Java, C++ or Go, and both differences produce wrong answers rather than errors.",
      ],
      examples: [
        {
          id: "modular-java",
          title: "Negative remainders and silent overflow",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static final int MOD = 1_000_000_007;

    static long power(long base, long exp, long mod) {
        long result = 1;
        base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) result = result * base % mod;
            base = base * base % mod;
            exp >>= 1;
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println("3^1000000 mod M = " + power(3, 1_000_000, MOD));

        // Java's % keeps the sign of the dividend, so a "modulus" can be negative.
        System.out.println("-5 % 7  in Java  = " + (-5 % 7));
        System.out.println("floorMod(-5, 7)  = " + Math.floorMod(-5, 7));

        // The overflow that silently ruins a modular answer.
        int a = 1_000_000_006, b = 1_000_000_006;
        System.out.println("\\nint  a*b % MOD = " + (a * b % MOD) + "   <- overflowed");
        System.out.println("long a*b % MOD = " + ((long) a * b % MOD));
    }
}`,
          output: `3^1000000 mod M = 64935414
-5 % 7  in Java  = -5
floorMod(-5, 7)  = 2

int  a*b % MOD = 923446813   <- overflowed
long a*b % MOD = 1`,
          explanation:
            "Look closely at the last two lines. The correct answer is `1`. The `int` version returns `923446813` — not a crash, not a negative number, not anything that looks wrong. It is a perfectly plausible residue, and if you were printing it as the answer to a counting problem you would have no way to tell. Two residues below `10^9 + 7` multiply to almost `10^18`, which overflows a 32-bit `int` by nine orders of magnitude. **Cast to `long` before every multiplication.**",
        },
      ],
      pitfalls: [
        {
          title: "Subtraction can go negative",
          body: "`(a - b) % MOD` is negative whenever `b > a`, and a negative answer is wrong. Write `((a - b) % MOD + MOD) % MOD`, or `Math.floorMod(a - b, MOD)` in Java. This bites most often in inclusion-exclusion, where subtraction is the whole method.",
        },
        {
          title: "Fermat's inverse needs a prime modulus",
          body: "`a^(p-2)` is only an inverse when `p` is prime. For a composite modulus use extended Euclid. And an inverse of `a` exists at all only when `gcd(a, m) = 1` — there is no inverse of 2 modulo 10.",
        },
      ],
    },
  ],
  takeaways: [
    "`10^9 + 7` is prime, which is what makes modular division possible",
    "Addition, subtraction and multiplication distribute; division does not",
    "Reduce early and often to keep intermediates bounded",
    "Fast exponentiation costs the bit length of the exponent — 60 steps for 10^18",
    "`a^(p-2) mod p` is the modular inverse when p is prime",
    "Cast to `long` before multiplying two residues, or the answer is silently wrong",
    "Normalise after subtraction: `((a - b) % m + m) % m`",
  ],
  status: "available",
};
