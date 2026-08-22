import type { Lesson } from "@/content/types";

export const realValuedLesson: Lesson = {
  id: "dsa-bs-real",
  slug: "real-valued-answers-and-precision",
  moduleSlug: "binary-search",
  title: "Real-Valued Answers & Precision",
  summary:
    "When the answer is a double rather than an integer, `lo < hi` never becomes false and the loop can spin forever. The fix is to stop asking whether you have converged and start counting iterations.",
  estimatedMinutes: 25,
  objectives: [
    "Binary search a continuous range",
    "Explain why a tolerance test can fail to terminate",
    "Choose a fixed iteration count from the required precision",
    "Avoid the equality and subtraction traps with floats",
  ],
  sections: [
    {
      id: "the-difference",
      heading: "Integers terminate for free; reals do not",
      body: [
        "With integers, `lo = mid + 1` guarantees progress and the window eventually empties. There is no `mid + 1` in the reals — `mid` is strictly between `lo` and `hi`, so the window shrinks but **never becomes empty**. `while lo < hi` would run until the two are adjacent floating-point values, and sometimes not even then.",
        "So the loop condition has to change. There are two options and only one of them is safe.",
      ],
      examples: [
        {
          id: "real-bisect",
          title: "Fixed iterations, and the tolerance loop that hangs",
          lang: "python",
          code: `# Binary search when the answer is a real number.

def sqrt_bisect(x, iterations=60):
    lo, hi = 0.0, max(1.0, x)
    for _ in range(iterations):
        mid = (lo + hi) / 2
        if mid * mid < x:
            lo = mid
        else:
            hi = mid
    return lo

for x in (2, 10, 0.25):
    print(f"sqrt({x:g}) = {sqrt_bisect(x):.10f}   (math: {x ** 0.5:.10f})")

# Why a fixed iteration count beats a tolerance test.
print("\\ninterval width after k halvings, starting from 10:")
for k in (10, 30, 50, 60, 100):
    print(f"  k={k:3}: 10 * 2^-{k} = {10 * 2.0 ** -k:.3e}")

# A tolerance loop can spin forever once the gap is below float resolution.
def dangerous(x, eps=1e-18, budget=200):
    lo, hi = 0.0, max(1.0, x)
    spins = 0
    while hi - lo > eps:
        spins += 1
        if spins > budget:
            return f"gave up after {budget} spins, gap still {hi - lo:.3e}"
        mid = (lo + hi) / 2
        if mid * mid < x:
            lo = mid
        else:
            hi = mid
    return f"converged in {spins} spins"

print("\\ntolerance 1e-18 on sqrt(2):", dangerous(2))
print("tolerance 1e-9  on sqrt(2):", dangerous(2, eps=1e-9))`,
          output: `sqrt(2) = 1.4142135624   (math: 1.4142135624)
sqrt(10) = 3.1622776602   (math: 3.1622776602)
sqrt(0.25) = 0.5000000000   (math: 0.5000000000)

interval width after k halvings, starting from 10:
  k= 10: 10 * 2^-10 = 9.766e-03
  k= 30: 10 * 2^-30 = 9.313e-09
  k= 50: 10 * 2^-50 = 8.882e-15
  k= 60: 10 * 2^-60 = 8.674e-18
  k=100: 10 * 2^-100 = 7.889e-30

tolerance 1e-18 on sqrt(2): gave up after 200 spins, gap still 2.220e-16
tolerance 1e-9  on sqrt(2): converged in 31 spins`,
          explanation:
            "The last two lines are the lesson. With a tolerance of `1e-18` the loop **never finishes**: the gap bottoms out at `2.22e-16`, which is the spacing between adjacent doubles near 1.4, and halving it again produces the same two numbers. Without the spin budget that program hangs. The same loop with a realistic `1e-9` converges in 31 iterations.\n\nThe table above it is how to pick the count instead. Each iteration halves the interval, so after k halvings the width is `(hi - lo) · 2^-k`. Solve for the precision you need and round up — 60 iterations takes a range of 10 down to `8.7e-18`, past double precision, which is why 100 is a common safe default and costs nothing.",
          alternates: [
            {
              lang: "javascript",
              code: `// Binary search when the answer is a real number.

// Python's \`%e\` pads the exponent to two digits and always signs it;
// toExponential does neither, so the padding is done here.
function sci(v, digits) {
  const [mantissa, exp] = v.toExponential(digits).split("e");
  const sign = exp[0] === "-" ? "-" : "+";
  const magnitude = exp.replace(/^[-+]/, "").padStart(2, "0");
  return \`\${mantissa}e\${sign}\${magnitude}\`;
}

const padL = (v, w) => String(v).padStart(w);

function sqrtBisect(x, iterations = 60) {
  let lo = 0.0;
  let hi = Math.max(1.0, x);
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    if (mid * mid < x) lo = mid;
    else hi = mid;
  }
  return lo;
}

for (const x of [2, 10, 0.25]) {
  console.log(\`sqrt(\${x}) = \${sqrtBisect(x).toFixed(10)}   (math: \${Math.sqrt(x).toFixed(10)})\`);
}

// Why a fixed iteration count beats a tolerance test.
console.log("\\ninterval width after k halvings, starting from 10:");
for (const k of [10, 30, 50, 60, 100]) {
  console.log(\`  k=\${padL(k, 3)}: 10 * 2^-\${k} = \${sci(10 * 2 ** -k, 3)}\`);
}

// A tolerance loop can spin forever once the gap is below float resolution.
function dangerous(x, eps = 1e-18, budget = 200) {
  let lo = 0.0;
  let hi = Math.max(1.0, x);
  let spins = 0;
  while (hi - lo > eps) {
    spins++;
    if (spins > budget) {
      return \`gave up after \${budget} spins, gap still \${sci(hi - lo, 3)}\`;
    }
    const mid = (lo + hi) / 2;
    if (mid * mid < x) lo = mid;
    else hi = mid;
  }
  return \`converged in \${spins} spins\`;
}

console.log("\\ntolerance 1e-18 on sqrt(2):", dangerous(2));
console.log("tolerance 1e-9  on sqrt(2):", dangerous(2, 1e-9));`,
            },
            {
              lang: "typescript",
              code: `// Binary search when the answer is a real number.

// Python's \`%e\` pads the exponent to two digits and always signs it;
// toExponential does neither, so the padding is done here.
function sci(v: number, digits: number): string {
  const [mantissa, exp] = v.toExponential(digits).split("e");
  const sign = exp[0] === "-" ? "-" : "+";
  const magnitude = exp.replace(/^[-+]/, "").padStart(2, "0");
  return \`\${mantissa}e\${sign}\${magnitude}\`;
}

const padL = (v: number, w: number): string => String(v).padStart(w);

function sqrtBisect(x: number, iterations = 60): number {
  let lo = 0.0;
  let hi = Math.max(1.0, x);
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    if (mid * mid < x) lo = mid;
    else hi = mid;
  }
  return lo;
}

for (const x of [2, 10, 0.25]) {
  console.log(\`sqrt(\${x}) = \${sqrtBisect(x).toFixed(10)}   (math: \${Math.sqrt(x).toFixed(10)})\`);
}

// Why a fixed iteration count beats a tolerance test.
console.log("\\ninterval width after k halvings, starting from 10:");
for (const k of [10, 30, 50, 60, 100]) {
  console.log(\`  k=\${padL(k, 3)}: 10 * 2^-\${k} = \${sci(10 * 2 ** -k, 3)}\`);
}

// A tolerance loop can spin forever once the gap is below float resolution.
function dangerous(x: number, eps = 1e-18, budget = 200): string {
  let lo = 0.0;
  let hi = Math.max(1.0, x);
  let spins = 0;
  while (hi - lo > eps) {
    spins++;
    if (spins > budget) {
      return \`gave up after \${budget} spins, gap still \${sci(hi - lo, 3)}\`;
    }
    const mid = (lo + hi) / 2;
    if (mid * mid < x) lo = mid;
    else hi = mid;
  }
  return \`converged in \${spins} spins\`;
}

console.log("\\ntolerance 1e-18 on sqrt(2):", dangerous(2));
console.log("tolerance 1e-9  on sqrt(2):", dangerous(2, 1e-9));`,
            },
            {
              lang: "java",
              code: `import java.util.*;

/** Binary search when the answer is a real number. */
public class Main {
    /* Python renders 2.0 as "2" and 0.25 as "0.25"; Double.toString always
       keeps the ".0", so the whole-number case is printed as an integer. */
    static String g(double v) {
        if (v == Math.rint(v) && Math.abs(v) < 1e15) return String.valueOf((long) v);
        return String.valueOf(v);
    }

    static double sqrtBisect(double x, int iterations) {
        double lo = 0.0, hi = Math.max(1.0, x);
        for (int i = 0; i < iterations; i++) {
            double mid = (lo + hi) / 2;
            if (mid * mid < x) lo = mid;
            else hi = mid;
        }
        return lo;
    }

    /** A tolerance loop can spin forever once the gap is below float resolution. */
    static String dangerous(double x, double eps, int budget) {
        double lo = 0.0, hi = Math.max(1.0, x);
        int spins = 0;
        while (hi - lo > eps) {
            spins++;
            if (spins > budget) {
                return String.format(Locale.ROOT,
                        "gave up after %d spins, gap still %.3e", budget, hi - lo);
            }
            double mid = (lo + hi) / 2;
            if (mid * mid < x) lo = mid;
            else hi = mid;
        }
        return "converged in " + spins + " spins";
    }

    public static void main(String[] args) {
        for (double x : new double[]{2, 10, 0.25}) {
            System.out.printf(Locale.ROOT, "sqrt(%s) = %.10f   (math: %.10f)%n",
                    g(x), sqrtBisect(x, 60), Math.sqrt(x));
        }

        // Why a fixed iteration count beats a tolerance test.
        System.out.println("\\ninterval width after k halvings, starting from 10:");
        for (int k : new int[]{10, 30, 50, 60, 100}) {
            System.out.printf(Locale.ROOT, "  k=%3d: 10 * 2^-%d = %.3e%n",
                    k, k, 10 * Math.pow(2.0, -k));
        }

        System.out.println("\\ntolerance 1e-18 on sqrt(2): " + dangerous(2, 1e-18, 200));
        System.out.println("tolerance 1e-9  on sqrt(2): " + dangerous(2, 1e-9, 200));
    }
}`,
            },
            {
              lang: "cpp",
              code: `// Binary search when the answer is a real number.
#include <algorithm>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
using namespace std;

string sci(double v, int digits) {
    ostringstream out;
    out << scientific << setprecision(digits) << v;
    return out.str();
}

double sqrtBisect(double x, int iterations = 60) {
    double lo = 0.0, hi = max(1.0, x);
    for (int i = 0; i < iterations; i++) {
        double mid = (lo + hi) / 2;
        if (mid * mid < x) lo = mid;
        else hi = mid;
    }
    return lo;
}

// A tolerance loop can spin forever once the gap is below float resolution.
string dangerous(double x, double eps = 1e-18, int budget = 200) {
    double lo = 0.0, hi = max(1.0, x);
    int spins = 0;
    while (hi - lo > eps) {
        spins++;
        if (spins > budget) {
            return "gave up after " + to_string(budget) + " spins, gap still "
                 + sci(hi - lo, 3);
        }
        double mid = (lo + hi) / 2;
        if (mid * mid < x) lo = mid;
        else hi = mid;
    }
    return "converged in " + to_string(spins) + " spins";
}

int main() {
    for (double x : {2.0, 10.0, 0.25}) {
        cout << "sqrt(" << defaultfloat << x << ") = " << fixed << setprecision(10)
             << sqrtBisect(x) << "   (math: " << sqrt(x) << ")\\n";
    }

    // Why a fixed iteration count beats a tolerance test.
    cout << defaultfloat << "\\ninterval width after k halvings, starting from 10:\\n";
    for (int k : {10, 30, 50, 60, 100}) {
        cout << "  k=" << setw(3) << k << ": 10 * 2^-" << k << " = "
             << sci(10 * pow(2.0, -k), 3) << "\\n";
    }

    cout << "\\ntolerance 1e-18 on sqrt(2): " << dangerous(2) << "\\n";
    cout << "tolerance 1e-9  on sqrt(2): " << dangerous(2, 1e-9) << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `// Binary search when the answer is a real number.

/// Python's \`%e\` pads the exponent to two digits and always signs it;
/// Rust's \`{:e}\` does neither, so the padding is done here.
fn sci(v: f64, digits: usize) -> String {
    let raw = format!("{:.*e}", digits, v);
    let (mantissa, exp) = raw.split_once('e').unwrap();
    let (sign, magnitude) = match exp.strip_prefix('-') {
        Some(rest) => ('-', rest),
        None => ('+', exp),
    };
    format!("{}e{}{:0>2}", mantissa, sign, magnitude)
}

fn sqrt_bisect(x: f64, iterations: u32) -> f64 {
    let (mut lo, mut hi) = (0.0f64, x.max(1.0));
    for _ in 0..iterations {
        let mid = (lo + hi) / 2.0;
        if mid * mid < x {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    lo
}

/// A tolerance loop can spin forever once the gap is below float resolution.
fn dangerous(x: f64, eps: f64, budget: u32) -> String {
    let (mut lo, mut hi) = (0.0f64, x.max(1.0));
    let mut spins = 0;
    while hi - lo > eps {
        spins += 1;
        if spins > budget {
            return format!(
                "gave up after {} spins, gap still {}",
                budget,
                sci(hi - lo, 3)
            );
        }
        let mid = (lo + hi) / 2.0;
        if mid * mid < x {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    format!("converged in {} spins", spins)
}

fn main() {
    for x in [2.0f64, 10.0, 0.25] {
        println!(
            "sqrt({}) = {:.10}   (math: {:.10})",
            x,
            sqrt_bisect(x, 60),
            x.sqrt()
        );
    }

    // Why a fixed iteration count beats a tolerance test.
    println!("\\ninterval width after k halvings, starting from 10:");
    for k in [10i32, 30, 50, 60, 100] {
        println!("  k={:3}: 10 * 2^-{} = {}", k, k, sci(10.0 * 2.0f64.powi(-k), 3));
    }

    println!("\\ntolerance 1e-18 on sqrt(2): {}", dangerous(2.0, 1e-18, 200));
    println!("tolerance 1e-9  on sqrt(2): {}", dangerous(2.0, 1e-9, 200));
}`,
            },
            {
              lang: "go",
              code: `// Binary search when the answer is a real number.
package main

import (
	"fmt"
	"math"
)

func sqrtBisect(x float64, iterations int) float64 {
	lo, hi := 0.0, math.Max(1.0, x)
	for i := 0; i < iterations; i++ {
		mid := (lo + hi) / 2
		if mid*mid < x {
			lo = mid
		} else {
			hi = mid
		}
	}
	return lo
}

// A tolerance loop can spin forever once the gap is below float resolution.
func dangerous(x, eps float64, budget int) string {
	lo, hi := 0.0, math.Max(1.0, x)
	spins := 0
	for hi-lo > eps {
		spins++
		if spins > budget {
			return fmt.Sprintf("gave up after %d spins, gap still %.3e", budget, hi-lo)
		}
		mid := (lo + hi) / 2
		if mid*mid < x {
			lo = mid
		} else {
			hi = mid
		}
	}
	return fmt.Sprintf("converged in %d spins", spins)
}

func main() {
	for _, x := range []float64{2, 10, 0.25} {
		fmt.Printf("sqrt(%v) = %.10f   (math: %.10f)\\n", x, sqrtBisect(x, 60), math.Sqrt(x))
	}

	// Why a fixed iteration count beats a tolerance test.
	fmt.Println("\\ninterval width after k halvings, starting from 10:")
	for _, k := range []int{10, 30, 50, 60, 100} {
		fmt.Printf("  k=%3d: 10 * 2^-%d = %.3e\\n", k, k, 10*math.Pow(2.0, float64(-k)))
	}

	fmt.Println("\\ntolerance 1e-18 on sqrt(2):", dangerous(2, 1e-18, 200))
	fmt.Println("tolerance 1e-9  on sqrt(2):", dangerous(2, 1e-9, 200))
}`,
            },
          ],
        },
      ],
    },
    {
      id: "practice",
      heading: "In practice",
      body: [
        "**Use a `for` loop with a fixed count.** 100 iterations is free — it is a hundred evaluations of the predicate, and it terminates unconditionally. This is what competitive programmers do, and the reason is exactly the failure above.",
        "**If you must use a tolerance, make it relative.** `hi - lo > eps * max(1.0, abs(lo))` scales with the magnitude, so it behaves for answers near 10⁹ as well as near zero. An absolute `1e-9` on an answer of a billion asks for sixteen significant digits, which a double does not have.",
        "**Do not test floats for equality.** There is no `a[mid] == target` branch in a real-valued search, and adding one is pointless — it will essentially never fire.",
      ],
      pitfalls: [
        {
          title: "`(lo + hi) / 2` is fine for floats and wrong for integers",
          body: "The overflow-safe form matters for ints. For doubles, `(lo + hi) / 2` is actually *more* accurate than `lo + (hi - lo) / 2` in the common case, and overflow only matters near 1e308. This is the one place the integer advice does not carry over.",
        },
        {
          title: "Read the required precision from the problem",
          body: "Statements say things like \"answers within 1e-6 of the expected value are accepted\". That is the number to aim at, and it tells you the iteration count directly. Aiming at 1e-15 when 1e-6 is accepted is harmless; aiming at 1e-6 when 1e-9 is required fails every test.",
        },
      ],
    },
  ],
  takeaways: [
    "A real-valued window shrinks forever but never empties",
    "Use a fixed iteration count, not a convergence test",
    "A tolerance below double epsilon makes the loop hang, not merely run long",
    "Each iteration halves the width: pick k from `(hi - lo) · 2^-k < precision`",
    "100 iterations is free and unconditionally safe",
    "Prefer a relative tolerance if you use one at all",
  ],
  status: "available",
};
