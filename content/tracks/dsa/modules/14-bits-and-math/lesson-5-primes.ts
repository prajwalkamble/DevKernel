import type { Lesson } from "@/content/types";

export const primesLesson: Lesson = {
  id: "dsa-math-primes",
  slug: "primes-sieves-and-factorisation",
  moduleSlug: "bit-manipulation-and-math",
  title: "Primes: the Sieve, Factorisation & Divisor Counting",
  summary:
    "Two different questions that people conflate — \"which numbers below n are prime\" and \"what are the factors of this one number\" — have two different answers with two different complexities. Plus the smallest-prime-factor sieve that makes repeated factorisation nearly free.",
  estimatedMinutes: 35,
  objectives: [
    "Write the Sieve of Eratosthenes and start the inner loop at i*i",
    "Explain the O(n log log n) bound informally",
    "Factorise a single number by trial division to sqrt(n)",
    "Count divisors from a factorisation without enumerating them",
    "Choose between a sieve and trial division from the problem's shape",
  ],
  sections: [
    {
      id: "two-questions",
      heading: "Two questions, two algorithms",
      body: [
        "**\"Which numbers up to n are prime?\"** — a sieve, O(n log log n) time and O(n) space. You get *all* of them.",
        "**\"What are the prime factors of this one number x?\"** — trial division to `sqrt(x)`, O(sqrt x) time and O(1) space.",
        "Choosing wrongly is the usual mistake. If a problem asks you to factorise a hundred thousand different numbers each up to a million, neither answer alone is right: you want the third option below, a smallest-prime-factor sieve, which pays the sieve cost once and then factorises each number in O(log x).",
      ],
    },
    {
      id: "sieve",
      heading: "The sieve, and the two optimisations that are not optional",
      body: [
        "Mark everything as prime, then for each prime `i`, cross off its multiples. Two details make the difference between the textbook version and the fast one.",
        "**Start the inner loop at `i*i`, not `2*i`.** Every multiple of `i` below `i*i` has a smaller prime factor and was already crossed off when that smaller prime was processed. Starting at `i*i` is what turns O(n log n) into O(n log log n).",
        "**Stop the outer loop at `sqrt(n)`.** If `i > sqrt(n)` then `i*i > n` and there is nothing left to cross off.",
      ],
      examples: [
        {
          id: "sieve",
          title: "Sieve, trial division, divisor count, and the SPF sieve",
          lang: "python",
          code: `def sieve(n):
    """True at i means i is prime. O(n log log n)."""
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False
    i = 2
    while i * i <= n:
        if is_prime[i]:
            # start at i*i: everything below is already crossed off
            for j in range(i * i, n + 1, i):
                is_prime[j] = False
        i += 1
    return is_prime

flags = sieve(50)
print("primes to 50:", [i for i, p in enumerate(flags) if p])
print("count        :", sum(flags))

def factorise(n):
    """Trial division to sqrt(n). O(sqrt n)."""
    out = []
    d = 2
    while d * d <= n:
        while n % d == 0:
            out.append(d)
            n //= d
        d += 1
    if n > 1:
        out.append(n)
    return out

for n in (360, 97, 1024, 999983):
    print(f"factorise({n}) = {factorise(n)}")

# divisor count from the factorisation: multiply (exponent + 1)
from collections import Counter
def divisor_count(n):
    total = 1
    for _, e in Counter(factorise(n)).items():
        total *= e + 1
    return total

for n in (360, 97, 1024):
    print(f"divisors({n}) = {divisor_count(n)}")

# smallest prime factor sieve: factorise in O(log n) after an O(n log log n) build
def spf_sieve(n):
    spf = list(range(n + 1))
    i = 2
    while i * i <= n:
        if spf[i] == i:
            for j in range(i * i, n + 1, i):
                if spf[j] == j:
                    spf[j] = i
        i += 1
    return spf

spf = spf_sieve(100)
def fast_factorise(n, spf):
    out = []
    while n > 1:
        out.append(spf[n])
        n //= spf[n]
    return out

print("\\nspf factorise(84) =", fast_factorise(84, spf))`,
          output: `primes to 50: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
count        : 15
factorise(360) = [2, 2, 2, 3, 3, 5]
factorise(97) = [97]
factorise(1024) = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
factorise(999983) = [999983]
divisors(360) = 24
divisors(97) = 2
divisors(1024) = 11

spf factorise(84) = [2, 2, 3, 7]`,
          explanation:
            "Three things to notice. The `if n > 1` at the end of `factorise` is not optional — it catches the final prime factor larger than `sqrt(n)`, which is why `factorise(999983)` returns the number itself rather than an empty list. The divisor count never enumerates a divisor: `360 = 2³ · 3² · 5`, so a divisor picks an exponent from 0-3, 0-2 and 0-1 independently, giving `4 · 3 · 2 = 24`. And the SPF sieve stores, for each number, its *smallest* prime factor, so factorising afterwards is just repeated division with no searching at all.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";

// True at i means i is prime. O(n log log n).
function sieve(n) {
  const isPrime = new Array(n + 1).fill(true);
  isPrime[0] = isPrime[1] = false;
  for (let i = 2; i * i <= n; i++) {
    if (isPrime[i]) {
      // start at i*i: everything below is already crossed off
      for (let j = i * i; j <= n; j += i) isPrime[j] = false;
    }
  }
  return isPrime;
}

const flags = sieve(50);
const primes = [];
flags.forEach((p, i) => {
  if (p) primes.push(i);
});
console.log("primes to 50:", list(primes));
console.log("count        :", primes.length);

// Trial division to sqrt(n). O(sqrt n).
function factorise(n) {
  const out = [];
  let d = 2;
  while (d * d <= n) {
    while (n % d === 0) {
      out.push(d);
      n = Math.floor(n / d);
    }
    d++;
  }
  if (n > 1) out.push(n);
  return out;
}

for (const n of [360, 97, 1024, 999983]) {
  console.log(\`factorise(\${n}) = \${list(factorise(n))}\`);
}

// divisor count from the factorisation: multiply (exponent + 1)
function divisorCount(n) {
  const counts = new Map();
  for (const f of factorise(n)) counts.set(f, (counts.get(f) ?? 0) + 1);
  let total = 1;
  for (const e of counts.values()) total *= e + 1;
  return total;
}

for (const n of [360, 97, 1024]) {
  console.log(\`divisors(\${n}) = \${divisorCount(n)}\`);
}

// smallest prime factor sieve: factorise in O(log n) after an O(n log log n) build
function spfSieve(n) {
  const spf = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 2; i * i <= n; i++) {
    if (spf[i] === i) {
      for (let j = i * i; j <= n; j += i) {
        if (spf[j] === j) spf[j] = i;
      }
    }
  }
  return spf;
}

const spf = spfSieve(100);
function fastFactorise(n, spf) {
  const out = [];
  while (n > 1) {
    out.push(spf[n]);
    n = Math.floor(n / spf[n]);
  }
  return out;
}

console.log("\\nspf factorise(84) =", list(fastFactorise(84, spf)));`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";

// True at i means i is prime. O(n log log n).
function sieve(n: number): boolean[] {
  const isPrime = new Array(n + 1).fill(true);
  isPrime[0] = isPrime[1] = false;
  for (let i = 2; i * i <= n; i++) {
    if (isPrime[i]) {
      // start at i*i: everything below is already crossed off
      for (let j = i * i; j <= n; j += i) isPrime[j] = false;
    }
  }
  return isPrime;
}

const flags = sieve(50);
const primes: number[] = [];
flags.forEach((p, i) => {
  if (p) primes.push(i);
});
console.log("primes to 50:", list(primes));
console.log("count        :", primes.length);

// Trial division to sqrt(n). O(sqrt n).
function factorise(n: number): number[] {
  const out: number[] = [];
  let d = 2;
  while (d * d <= n) {
    while (n % d === 0) {
      out.push(d);
      n = Math.floor(n / d);
    }
    d++;
  }
  if (n > 1) out.push(n);
  return out;
}

for (const n of [360, 97, 1024, 999983]) {
  console.log(\`factorise(\${n}) = \${list(factorise(n))}\`);
}

// divisor count from the factorisation: multiply (exponent + 1)
function divisorCount(n: number): number {
  const counts = new Map<number, number>();
  for (const f of factorise(n)) counts.set(f, (counts.get(f) ?? 0) + 1);
  let total = 1;
  for (const e of counts.values()) total *= e + 1;
  return total;
}

for (const n of [360, 97, 1024]) {
  console.log(\`divisors(\${n}) = \${divisorCount(n)}\`);
}

// smallest prime factor sieve: factorise in O(log n) after an O(n log log n) build
function spfSieve(n: number): number[] {
  const spf = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 2; i * i <= n; i++) {
    if (spf[i] === i) {
      for (let j = i * i; j <= n; j += i) {
        if (spf[j] === j) spf[j] = i;
      }
    }
  }
  return spf;
}

const spf = spfSieve(100);
function fastFactorise(n: number, spf: number[]): number[] {
  const out: number[] = [];
  while (n > 1) {
    out.push(spf[n]);
    n = Math.floor(n / spf[n]);
  }
  return out;
}

console.log("\\nspf factorise(84) =", list(fastFactorise(84, spf)));`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static String list(List<Integer> xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs.get(i));
        }
        return sb.append("]").toString();
    }

    /** True at i means i is prime. O(n log log n). */
    static boolean[] sieve(int n) {
        boolean[] isPrime = new boolean[n + 1];
        Arrays.fill(isPrime, true);
        isPrime[0] = isPrime[1] = false;
        for (int i = 2; (long) i * i <= n; i++) {
            if (isPrime[i]) {
                // start at i*i: everything below is already crossed off
                for (int j = i * i; j <= n; j += i) isPrime[j] = false;
            }
        }
        return isPrime;
    }

    /** Trial division to sqrt(n). O(sqrt n). */
    static List<Integer> factorise(int n) {
        List<Integer> out = new ArrayList<>();
        for (int d = 2; (long) d * d <= n; d++) {
            while (n % d == 0) {
                out.add(d);
                n /= d;
            }
        }
        if (n > 1) out.add(n);
        return out;
    }

    /** divisor count from the factorisation: multiply (exponent + 1) */
    static int divisorCount(int n) {
        Map<Integer, Integer> counts = new LinkedHashMap<>();
        for (int f : factorise(n)) counts.merge(f, 1, Integer::sum);
        int total = 1;
        for (int e : counts.values()) total *= e + 1;
        return total;
    }

    /** smallest prime factor sieve: O(log n) per factorisation after the build */
    static int[] spfSieve(int n) {
        int[] spf = new int[n + 1];
        for (int i = 0; i <= n; i++) spf[i] = i;
        for (int i = 2; (long) i * i <= n; i++) {
            if (spf[i] == i) {
                for (int j = i * i; j <= n; j += i) {
                    if (spf[j] == j) spf[j] = i;
                }
            }
        }
        return spf;
    }

    static List<Integer> fastFactorise(int n, int[] spf) {
        List<Integer> out = new ArrayList<>();
        while (n > 1) {
            out.add(spf[n]);
            n /= spf[n];
        }
        return out;
    }

    public static void main(String[] args) {
        boolean[] flags = sieve(50);
        List<Integer> primes = new ArrayList<>();
        for (int i = 0; i < flags.length; i++) {
            if (flags[i]) primes.add(i);
        }
        System.out.println("primes to 50: " + list(primes));
        System.out.println("count        : " + primes.size());

        for (int n : new int[]{360, 97, 1024, 999983}) {
            System.out.println("factorise(" + n + ") = " + list(factorise(n)));
        }

        for (int n : new int[]{360, 97, 1024}) {
            System.out.println("divisors(" + n + ") = " + divisorCount(n));
        }

        int[] spf = spfSieve(100);
        System.out.println("\\nspf factorise(84) = " + list(fastFactorise(84, spf)));
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <map>
#include <numeric>
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

// True at i means i is prime. O(n log log n).
vector<bool> sieve(int n) {
    vector<bool> isPrime(n + 1, true);
    isPrime[0] = isPrime[1] = false;
    for (long long i = 2; i * i <= n; i++) {
        if (isPrime[i]) {
            // start at i*i: everything below is already crossed off
            for (long long j = i * i; j <= n; j += i) isPrime[j] = false;
        }
    }
    return isPrime;
}

// Trial division to sqrt(n). O(sqrt n).
vector<int> factorise(int n) {
    vector<int> out;
    for (long long d = 2; d * d <= n; d++) {
        while (n % d == 0) {
            out.push_back((int)d);
            n /= (int)d;
        }
    }
    if (n > 1) out.push_back(n);
    return out;
}

// divisor count from the factorisation: multiply (exponent + 1)
int divisorCount(int n) {
    map<int, int> counts;
    for (int f : factorise(n)) counts[f]++;
    int total = 1;
    for (const auto& [_, e] : counts) total *= e + 1;
    return total;
}

// smallest prime factor sieve: O(log n) per factorisation after the build
vector<int> spfSieve(int n) {
    vector<int> spf(n + 1);
    iota(spf.begin(), spf.end(), 0);
    for (long long i = 2; i * i <= n; i++) {
        if (spf[i] == i) {
            for (long long j = i * i; j <= n; j += i) {
                if (spf[j] == j) spf[j] = (int)i;
            }
        }
    }
    return spf;
}

vector<int> fastFactorise(int n, const vector<int>& spf) {
    vector<int> out;
    while (n > 1) {
        out.push_back(spf[n]);
        n /= spf[n];
    }
    return out;
}

int main() {
    vector<bool> flags = sieve(50);
    vector<int> primes;
    for (size_t i = 0; i < flags.size(); i++) {
        if (flags[i]) primes.push_back((int)i);
    }
    cout << "primes to 50: " << list(primes) << "\\n";
    cout << "count        : " << primes.size() << "\\n";

    for (int n : {360, 97, 1024, 999983}) {
        cout << "factorise(" << n << ") = " << list(factorise(n)) << "\\n";
    }

    for (int n : {360, 97, 1024}) {
        cout << "divisors(" << n << ") = " << divisorCount(n) << "\\n";
    }

    vector<int> spf = spfSieve(100);
    cout << "\\nspf factorise(84) = " << list(fastFactorise(84, spf)) << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::collections::BTreeMap;

fn list(xs: &[i64]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

/// True at i means i is prime. O(n log log n).
fn sieve(n: usize) -> Vec<bool> {
    let mut is_prime = vec![true; n + 1];
    is_prime[0] = false;
    is_prime[1] = false;
    let mut i = 2;
    while i * i <= n {
        if is_prime[i] {
            // start at i*i: everything below is already crossed off
            let mut j = i * i;
            while j <= n {
                is_prime[j] = false;
                j += i;
            }
        }
        i += 1;
    }
    is_prime
}

/// Trial division to sqrt(n). O(sqrt n).
fn factorise(mut n: i64) -> Vec<i64> {
    let mut out = Vec::new();
    let mut d = 2;
    while d * d <= n {
        while n % d == 0 {
            out.push(d);
            n /= d;
        }
        d += 1;
    }
    if n > 1 {
        out.push(n);
    }
    out
}

/// divisor count from the factorisation: multiply (exponent + 1)
fn divisor_count(n: i64) -> i64 {
    let mut counts: BTreeMap<i64, i64> = BTreeMap::new();
    for f in factorise(n) {
        *counts.entry(f).or_insert(0) += 1;
    }
    counts.values().map(|e| e + 1).product()
}

/// smallest prime factor sieve: O(log n) per factorisation after the build
fn spf_sieve(n: usize) -> Vec<usize> {
    let mut spf: Vec<usize> = (0..=n).collect();
    let mut i = 2;
    while i * i <= n {
        if spf[i] == i {
            let mut j = i * i;
            while j <= n {
                if spf[j] == j {
                    spf[j] = i;
                }
                j += i;
            }
        }
        i += 1;
    }
    spf
}

fn fast_factorise(mut n: usize, spf: &[usize]) -> Vec<i64> {
    let mut out = Vec::new();
    while n > 1 {
        out.push(spf[n] as i64);
        n /= spf[n];
    }
    out
}

fn main() {
    let flags = sieve(50);
    let primes: Vec<i64> = flags
        .iter()
        .enumerate()
        .filter(|(_, p)| **p)
        .map(|(i, _)| i as i64)
        .collect();
    println!("primes to 50: {}", list(&primes));
    println!("count        : {}", primes.len());

    for n in [360i64, 97, 1024, 999983] {
        println!("factorise({}) = {}", n, list(&factorise(n)));
    }

    for n in [360i64, 97, 1024] {
        println!("divisors({}) = {}", n, divisor_count(n));
    }

    let spf = spf_sieve(100);
    println!("\\nspf factorise(84) = {}", list(&fast_factorise(84, &spf)));
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

// True at i means i is prime. O(n log log n).
func sieve(n int) []bool {
	isPrime := make([]bool, n+1)
	for i := range isPrime {
		isPrime[i] = true
	}
	isPrime[0], isPrime[1] = false, false
	for i := 2; i*i <= n; i++ {
		if isPrime[i] {
			// start at i*i: everything below is already crossed off
			for j := i * i; j <= n; j += i {
				isPrime[j] = false
			}
		}
	}
	return isPrime
}

// Trial division to sqrt(n). O(sqrt n).
func factorise(n int) []int {
	var out []int
	for d := 2; d*d <= n; d++ {
		for n%d == 0 {
			out = append(out, d)
			n /= d
		}
	}
	if n > 1 {
		out = append(out, n)
	}
	return out
}

// divisor count from the factorisation: multiply (exponent + 1)
func divisorCount(n int) int {
	counts := map[int]int{}
	for _, f := range factorise(n) {
		counts[f]++
	}
	total := 1
	for _, e := range counts {
		total *= e + 1
	}
	return total
}

// smallest prime factor sieve: O(log n) per factorisation after the build
func spfSieve(n int) []int {
	spf := make([]int, n+1)
	for i := range spf {
		spf[i] = i
	}
	for i := 2; i*i <= n; i++ {
		if spf[i] == i {
			for j := i * i; j <= n; j += i {
				if spf[j] == j {
					spf[j] = i
				}
			}
		}
	}
	return spf
}

func fastFactorise(n int, spf []int) []int {
	var out []int
	for n > 1 {
		out = append(out, spf[n])
		n /= spf[n]
	}
	return out
}

func main() {
	flags := sieve(50)
	var primes []int
	for i, p := range flags {
		if p {
			primes = append(primes, i)
		}
	}
	fmt.Println("primes to 50:", list(primes))
	fmt.Println("count        :", len(primes))

	for _, n := range []int{360, 97, 1024, 999983} {
		fmt.Printf("factorise(%d) = %s\\n", n, list(factorise(n)))
	}

	for _, n := range []int{360, 97, 1024} {
		fmt.Printf("divisors(%d) = %d\\n", n, divisorCount(n))
	}

	spf := spfSieve(100)
	fmt.Println("\\nspf factorise(84) =", list(fastFactorise(84, spf)))
}`,
            },
          ],
        },
      ],
    },
    {
      id: "complexity",
      heading: "Where O(n log log n) comes from",
      body: [
        "The inner loop for prime `p` runs about `n/p` times. Summing over all primes below n gives `n · (1/2 + 1/3 + 1/5 + 1/7 + ...)`, and the sum of reciprocals of primes up to n grows like `log log n` — a result of Mertens'.",
        "`log log n` is effectively a small constant: for n = 10⁸ it is about 3. So a sieve is close to linear in practice, and sieving ten million numbers is a matter of milliseconds. Treat it as \"basically O(n)\" when you are estimating whether a solution fits.",
      ],
    },
    {
      id: "choosing",
      heading: "Choosing, and the traps",
      body: [
        "**One number, possibly large** — trial division. `sqrt(10^12)` is a million iterations, which is fine.",
        "**All numbers up to n, with n ≤ 10^7** — a sieve.",
        "**Many numbers, all bounded by n** — an SPF sieve, built once.",
        "**One number up to 10^18** — neither. That needs Pollard's rho, which is beyond this module and almost never asked.",
      ],
      pitfalls: [
        {
          title: "Forgetting `if n > 1` after the trial-division loop",
          body: "When the remaining value is a prime larger than `sqrt(original)`, the loop never reaches it. Omit the check and `factorise(14)` returns `[2]` rather than `[2, 7]` — and every test with a smooth number passes, so the bug survives casual testing.",
        },
        {
          title: "`1` is not prime, and `0` and `1` must be cleared explicitly",
          body: "The array starts all-true and the crossing-off loop never touches indices 0 and 1. Setting them false by hand is one line that is easy to skip and produces two wrong answers.",
        },
        {
          title: "`i * i <= n` can overflow in a fixed-width language",
          body: "For n near `Integer.MAX_VALUE`, `i * i` overflows and the loop condition goes wrong. Write `i <= n / i` instead, which cannot.",
        },
      ],
    },
  ],
  takeaways: [
    "\"All primes below n\" and \"factor this one number\" are different problems",
    "Sieve: start the inner loop at `i*i`, stop the outer at `sqrt(n)`",
    "O(n log log n) is effectively linear — treat log log n as about 3",
    "Trial division needs the `if n > 1` tail or it drops a large prime factor",
    "Divisor count is the product of (exponent + 1), with no enumeration",
    "An SPF sieve makes repeated factorisation O(log x) after one build",
    "Write `i <= n / i` rather than `i * i <= n` to avoid overflow",
  ],
  status: "available",
};
