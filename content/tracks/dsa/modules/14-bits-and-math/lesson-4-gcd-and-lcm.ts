import type { Lesson } from "@/content/types";

export const gcdAndLcmLesson: Lesson = {
  id: "dsa-math-gcd",
  slug: "gcd-lcm-and-the-euclidean-algorithm",
  moduleSlug: "bit-manipulation-and-math",
  title: "GCD, LCM & the Euclidean Algorithm",
  summary:
    "The oldest algorithm still in use, why it finishes in O(log n) rather than O(n), the one-line LCM that overflows if you write it in the obvious order, and the extended version that solves linear Diophantine equations.",
  estimatedMinutes: 30,
  objectives: [
    "Write the Euclidean algorithm iteratively and explain why it terminates",
    "Justify the O(log min(a, b)) bound",
    "Compute LCM without overflowing",
    "Use the extended algorithm to find coefficients and modular inverses",
    "Recognise the problems that are secretly GCD problems",
  ],
  sections: [
    {
      id: "euclid",
      heading: "Two lines, two thousand years old",
      body: [
        "The whole algorithm is `gcd(a, b) = gcd(b, a mod b)`, with `gcd(a, 0) = a`.",
        "The reason it works: any number dividing both `a` and `b` also divides `a - b`, and therefore divides `a mod b`, which is just `a` with copies of `b` removed. So the pair `(a, b)` and the pair `(b, a mod b)` have exactly the same set of common divisors — and the second pair is strictly smaller. Repeat until one side is zero, and the other is the answer.",
      ],
      examples: [
        {
          id: "gcd-trace",
          title: "The algorithm, traced",
          lang: "python",
          code: `def gcd_trace(a, b):
    print(f"gcd({a}, {b})")
    while b:
        print(f"  {a} = {a // b} * {b} + {a % b}")
        a, b = b, a % b
    return a

print("result:", gcd_trace(1071, 462))
print()

def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

def lcm(a, b):
    return a // gcd(a, b) * b

print("gcd(12, 18) =", gcd(12, 18))
print("lcm(12, 18) =", lcm(12, 18))
print("gcd(0, 5)   =", gcd(0, 5))
print("gcd(7, 13)  =", gcd(7, 13), "(coprime)")

# gcd of a whole list
from functools import reduce
xs = [12, 18, 30]
print("gcd of", xs, "=", reduce(gcd, xs))

# extended euclid: finds x, y with ax + by = gcd(a, b)
def ext_gcd(a, b):
    if b == 0:
        return a, 1, 0
    g, x1, y1 = ext_gcd(b, a % b)
    return g, y1, x1 - (a // b) * y1

g, x, y = ext_gcd(240, 46)
print(f"\\next_gcd(240, 46) -> g={g}, x={x}, y={y}")
print(f"check: 240*{x} + 46*{y} = {240 * x + 46 * y}")`,
          output: `gcd(1071, 462)
  1071 = 2 * 462 + 147
  462 = 3 * 147 + 21
  147 = 7 * 21 + 0
result: 21

gcd(12, 18) = 6
lcm(12, 18) = 36
gcd(0, 5)   = 5
gcd(7, 13)  = 1 (coprime)
gcd of [12, 18, 30] = 6

ext_gcd(240, 46) -> g=2, x=-9, y=47
check: 240*-9 + 46*47 = 2`,
          explanation:
            "Three divisions for a pair over a thousand. `gcd(0, 5) = 5` falls out of the base case without a special branch, which is worth checking because problems do hand you zeros. And `reduce` extends it to a list for free, because gcd is associative — `gcd(a, b, c)` is `gcd(gcd(a, b), c)`.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";

function gcdTrace(a, b) {
  console.log(\`gcd(\${a}, \${b})\`);
  while (b) {
    console.log(\`  \${a} = \${Math.floor(a / b)} * \${b} + \${a % b}\`);
    [a, b] = [b, a % b];
  }
  return a;
}

// Computed before the print: the call logs its own lines, which belong above.
const traced = gcdTrace(1071, 462);
console.log("result:", traced);
console.log();

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

function lcm(a, b) {
  return Math.floor(a / gcd(a, b)) * b;
}

console.log("gcd(12, 18) =", gcd(12, 18));
console.log("lcm(12, 18) =", lcm(12, 18));
console.log("gcd(0, 5)   =", gcd(0, 5));
console.log("gcd(7, 13)  =", gcd(7, 13), "(coprime)");

// gcd of a whole list
const xs = [12, 18, 30];
console.log("gcd of", list(xs), "=", xs.reduce(gcd));

// extended euclid: finds x, y with ax + by = gcd(a, b)
function extGcd(a, b) {
  if (b === 0) return [a, 1, 0];
  const [g, x1, y1] = extGcd(b, a % b);
  return [g, y1, x1 - Math.floor(a / b) * y1];
}

const [g, x, y] = extGcd(240, 46);
console.log(\`\\next_gcd(240, 46) -> g=\${g}, x=\${x}, y=\${y}\`);
console.log(\`check: 240*\${x} + 46*\${y} = \${240 * x + 46 * y}\`);`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";

function gcdTrace(a: number, b: number): number {
  console.log(\`gcd(\${a}, \${b})\`);
  while (b) {
    console.log(\`  \${a} = \${Math.floor(a / b)} * \${b} + \${a % b}\`);
    [a, b] = [b, a % b];
  }
  return a;
}

// Computed before the print: the call logs its own lines, which belong above.
const traced = gcdTrace(1071, 462);
console.log("result:", traced);
console.log();

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

function lcm(a: number, b: number): number {
  return Math.floor(a / gcd(a, b)) * b;
}

console.log("gcd(12, 18) =", gcd(12, 18));
console.log("lcm(12, 18) =", lcm(12, 18));
console.log("gcd(0, 5)   =", gcd(0, 5));
console.log("gcd(7, 13)  =", gcd(7, 13), "(coprime)");

// gcd of a whole list
const xs: number[] = [12, 18, 30];
console.log("gcd of", list(xs), "=", xs.reduce(gcd));

// extended euclid: finds x, y with ax + by = gcd(a, b)
function extGcd(a: number, b: number): [number, number, number] {
  if (b === 0) return [a, 1, 0];
  const [g, x1, y1] = extGcd(b, a % b);
  return [g, y1, x1 - Math.floor(a / b) * y1];
}

const [g, x, y] = extGcd(240, 46);
console.log(\`\\next_gcd(240, 46) -> g=\${g}, x=\${x}, y=\${y}\`);
console.log(\`check: 240*\${x} + 46*\${y} = \${240 * x + 46 * y}\`);`,
            },
            {
              lang: "java",
              code: `public class Main {
    static int gcdTrace(int a, int b) {
        System.out.println("gcd(" + a + ", " + b + ")");
        while (b != 0) {
            System.out.println("  " + a + " = " + a / b + " * " + b + " + " + a % b);
            int t = a % b;
            a = b;
            b = t;
        }
        return a;
    }

    static int gcd(int a, int b) {
        while (b != 0) {
            int t = a % b;
            a = b;
            b = t;
        }
        return a;
    }

    static int lcm(int a, int b) {
        return a / gcd(a, b) * b;
    }

    /** extended euclid: finds x, y with ax + by = gcd(a, b) */
    static int[] extGcd(int a, int b) {
        if (b == 0) return new int[]{a, 1, 0};
        int[] r = extGcd(b, a % b);
        return new int[]{r[0], r[2], r[1] - (a / b) * r[2]};
    }

    public static void main(String[] args) {
        int traced = gcdTrace(1071, 462);
        System.out.println("result: " + traced);
        System.out.println();

        System.out.println("gcd(12, 18) = " + gcd(12, 18));
        System.out.println("lcm(12, 18) = " + lcm(12, 18));
        System.out.println("gcd(0, 5)   = " + gcd(0, 5));
        System.out.println("gcd(7, 13)  = " + gcd(7, 13) + " (coprime)");

        // gcd of a whole list
        int[] xs = {12, 18, 30};
        int acc = xs[0];
        for (int i = 1; i < xs.length; i++) acc = gcd(acc, xs[i]);
        System.out.println("gcd of [12, 18, 30] = " + acc);

        int[] e = extGcd(240, 46);
        System.out.println("\\next_gcd(240, 46) -> g=" + e[0] + ", x=" + e[1] + ", y=" + e[2]);
        System.out.println("check: 240*" + e[1] + " + 46*" + e[2]
                + " = " + (240 * e[1] + 46 * e[2]));
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <array>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string list(const vector<int>& xs) {
    string out = "[";
    for (size_t i = 0; i < xs.size(); i++) {
        if (i) out += ", ";
        out += to_string(xs[i]);
    }
    return out + "]";
}

int gcdTrace(int a, int b) {
    cout << "gcd(" << a << ", " << b << ")\\n";
    while (b) {
        cout << "  " << a << " = " << a / b << " * " << b << " + " << a % b << "\\n";
        int t = a % b;
        a = b;
        b = t;
    }
    return a;
}

int gcd(int a, int b) {
    while (b) {
        int t = a % b;
        a = b;
        b = t;
    }
    return a;
}

int lcm(int a, int b) { return a / gcd(a, b) * b; }

// extended euclid: finds x, y with ax + by = gcd(a, b)
array<int, 3> extGcd(int a, int b) {
    if (b == 0) return {a, 1, 0};
    auto [g, x1, y1] = extGcd(b, a % b);
    return {g, y1, x1 - (a / b) * y1};
}

int main() {
    int traced = gcdTrace(1071, 462);
    cout << "result: " << traced << "\\n\\n";

    cout << "gcd(12, 18) = " << gcd(12, 18) << "\\n";
    cout << "lcm(12, 18) = " << lcm(12, 18) << "\\n";
    cout << "gcd(0, 5)   = " << gcd(0, 5) << "\\n";
    cout << "gcd(7, 13)  = " << gcd(7, 13) << " (coprime)\\n";

    // gcd of a whole list
    vector<int> xs = {12, 18, 30};
    int acc = xs[0];
    for (size_t i = 1; i < xs.size(); i++) acc = gcd(acc, xs[i]);
    cout << "gcd of " << list(xs) << " = " << acc << "\\n";

    auto [g, x, y] = extGcd(240, 46);
    cout << "\\next_gcd(240, 46) -> g=" << g << ", x=" << x << ", y=" << y << "\\n";
    cout << "check: 240*" << x << " + 46*" << y << " = " << 240 * x + 46 * y << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn gcd_trace(mut a: i32, mut b: i32) -> i32 {
    println!("gcd({}, {})", a, b);
    while b != 0 {
        println!("  {} = {} * {} + {}", a, a / b, b, a % b);
        let t = a % b;
        a = b;
        b = t;
    }
    a
}

fn gcd(mut a: i32, mut b: i32) -> i32 {
    while b != 0 {
        let t = a % b;
        a = b;
        b = t;
    }
    a
}

fn lcm(a: i32, b: i32) -> i32 {
    a / gcd(a, b) * b
}

/// extended euclid: finds x, y with ax + by = gcd(a, b)
fn ext_gcd(a: i32, b: i32) -> (i32, i32, i32) {
    if b == 0 {
        return (a, 1, 0);
    }
    let (g, x1, y1) = ext_gcd(b, a % b);
    (g, y1, x1 - (a / b) * y1)
}

fn main() {
    let traced = gcd_trace(1071, 462);
    println!("result: {}", traced);
    println!();

    println!("gcd(12, 18) = {}", gcd(12, 18));
    println!("lcm(12, 18) = {}", lcm(12, 18));
    println!("gcd(0, 5)   = {}", gcd(0, 5));
    println!("gcd(7, 13)  = {} (coprime)", gcd(7, 13));

    // gcd of a whole list
    let xs = [12, 18, 30];
    let acc = xs.iter().copied().reduce(gcd).unwrap();
    println!("gcd of {} = {}", list(&xs), acc);

    let (g, x, y) = ext_gcd(240, 46);
    println!("\\next_gcd(240, 46) -> g={}, x={}, y={}", g, x, y);
    println!("check: 240*{} + 46*{} = {}", x, y, 240 * x + 46 * y);
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func gcdTrace(a, b int) int {
	fmt.Printf("gcd(%d, %d)\\n", a, b)
	for b != 0 {
		fmt.Printf("  %d = %d * %d + %d\\n", a, a/b, b, a%b)
		a, b = b, a%b
	}
	return a
}

func gcd(a, b int) int {
	for b != 0 {
		a, b = b, a%b
	}
	return a
}

func lcm(a, b int) int { return a / gcd(a, b) * b }

// extended euclid: finds x, y with ax + by = gcd(a, b)
func extGcd(a, b int) (int, int, int) {
	if b == 0 {
		return a, 1, 0
	}
	g, x1, y1 := extGcd(b, a%b)
	return g, y1, x1 - (a/b)*y1
}

func main() {
	traced := gcdTrace(1071, 462)
	fmt.Println("result:", traced)
	fmt.Println()

	fmt.Println("gcd(12, 18) =", gcd(12, 18))
	fmt.Println("lcm(12, 18) =", lcm(12, 18))
	fmt.Println("gcd(0, 5)   =", gcd(0, 5))
	fmt.Println("gcd(7, 13)  =", gcd(7, 13), "(coprime)")

	// gcd of a whole list
	xs := []int{12, 18, 30}
	acc := xs[0]
	for _, v := range xs[1:] {
		acc = gcd(acc, v)
	}
	fmt.Println("gcd of", list(xs), "=", acc)

	g, x, y := extGcd(240, 46)
	fmt.Printf("\\next_gcd(240, 46) -> g=%d, x=%d, y=%d\\n", g, x, y)
	fmt.Printf("check: 240*%d + 46*%d = %d\\n", x, y, 240*x+46*y)
}`,
            },
          ],
        },
      ],
    },
    {
      id: "why-fast",
      heading: "Why it is O(log n)",
      body: [
        "The bound is not obvious from the code, and the argument is short. **After two steps, the larger value has at least halved.**",
        "Consider `a mod b`. If `b ≤ a/2`, then the new pair's larger element is already at most `a/2`. If `b > a/2`, then `a mod b = a - b < a/2`. Either way, two iterations cut the larger value in half — so the number of iterations is at most `2 log₂(min(a, b))`.",
        "The worst case is consecutive Fibonacci numbers, which is a pleasing fact and also the reason the bound cannot be improved: `gcd(F(n+1), F(n))` takes exactly n steps.",
      ],
    },
    {
      id: "lcm-overflow",
      heading: "LCM, and the order that matters",
      body: [
        "`lcm(a, b) = a * b / gcd(a, b)`, which is correct arithmetic and a bug in any fixed-width language. The product `a * b` can overflow long before the *answer* comes anywhere near the limit.",
        "Divide first: **`a / gcd(a, b) * b`**. The division is exact — the gcd divides `a` by definition — so nothing is lost, and the intermediate value never exceeds the result.",
      ],
      examples: [
        {
          id: "lcm-overflow",
          title: "The same formula, two orders, one wrong answer",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static long gcd(long a, long b) {
        while (b != 0) { long t = a % b; a = b; b = t; }
        return a;
    }

    // Divide first. a*b can overflow long even when the answer fits easily.
    static long lcmSafe(long a, long b) { return a / gcd(a, b) * b; }
    static long lcmNaive(long a, long b) { return a * b / gcd(a, b); }

    public static void main(String[] args) {
        long a = 3_000_000_000L, b = 4_000_000_000L;
        System.out.println("gcd       = " + gcd(a, b));
        System.out.println("lcm safe  = " + lcmSafe(a, b));
        System.out.println("lcm naive = " + lcmNaive(a, b) + "   <- a*b overflowed");
        System.out.println("a*b       = " + (a * b));
        System.out.println("Long.MAX  = " + Long.MAX_VALUE);
    }
}`,
          output: `gcd       = 1000000000
lcm safe  = 12000000000
lcm naive = -6446744073   <- a*b overflowed
a*b       = -6446744073709551616
Long.MAX  = 9223372036854775807`,
          explanation:
            "The answer is twelve billion, which fits in a `long` with room to spare — nine quintillion of it. The naive version still fails, because it computes a product of twelve *quintillion* on the way there. Note that the wrong answer is not obviously wrong at a glance: it is a plausible-looking negative number, and in a problem that only prints the result you would never know.",
        },
      ],
    },
    {
      id: "extended",
      heading: "The extended algorithm, and what it is for",
      body: [
        "Extended Euclid returns not just `g = gcd(a, b)` but a pair `(x, y)` with `ax + by = g`. Bézout's identity guarantees such a pair always exists.",
        "Two uses justify learning it. **Modular inverses when the modulus is not prime:** if `gcd(a, m) = 1` then `ax + my = 1`, so `ax ≡ 1 (mod m)` and `x` is the inverse. Fermat's little theorem, which the modular-arithmetic lesson uses, needs a *prime* modulus; this does not. **Linear Diophantine equations:** `ax + by = c` has integer solutions exactly when `gcd(a, b)` divides `c`, and extended Euclid hands you one, from which all the others follow.",
      ],
      pitfalls: [
        {
          title: "`x` may be negative",
          body: "`ext_gcd(240, 46)` returns `x = -9`. As a modular inverse that is useless until you normalise it: `((x % m) + m) % m`. Forgetting this produces a negative index or a negative answer, and it is the single most common bug in code that uses extended Euclid.",
        },
      ],
    },
    {
      id: "recognising",
      heading: "Problems that are secretly GCD problems",
      body: [
        "**Anything about repeating cycles lining up.** Two lights blinking every 6 and 8 seconds coincide every `lcm(6, 8)` seconds. Gear ratios, calendar problems, and \"when do these two patterns align\" are all LCM.",
        "**Reducing a fraction, or comparing two.** Divide both parts by their gcd.",
        "**\"Can you measure exactly c litres with jugs of a and b?\"** Yes precisely when `gcd(a, b)` divides `c` — that is Bézout, restated as a puzzle.",
        "**A repeated pattern in a string.** The smallest repeating unit of a string of length n that also appears at offset k has length `gcd(n, k)`.",
      ],
    },
  ],
  takeaways: [
    "`gcd(a, b) = gcd(b, a mod b)`, terminating at `gcd(a, 0) = a`",
    "Two iterations halve the larger value, giving O(log min(a, b))",
    "Write LCM as `a / gcd(a, b) * b` — dividing first cannot overflow",
    "gcd is associative, so a list folds with `reduce`",
    "Extended Euclid gives modular inverses for a non-prime modulus",
    "Normalise the extended coefficient with `((x % m) + m) % m`",
    "Cycles lining up means LCM; measuring and reducing means GCD",
  ],
  status: "available",
};
