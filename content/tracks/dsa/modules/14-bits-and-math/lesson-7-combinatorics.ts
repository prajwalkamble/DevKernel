import type { Lesson } from "@/content/types";

export const combinatoricsLesson: Lesson = {
  id: "dsa-math-combinatorics",
  slug: "combinatorics-under-a-modulus",
  moduleSlug: "bit-manipulation-and-math",
  title: "Combinatorics: nCr Under a Modulus",
  summary:
    "Two ways to compute binomial coefficients: Pascal's triangle, which needs no division and no modular inverse, and precomputed factorials, which answers any query in constant time after a linear build. When each one is right.",
  estimatedMinutes: 30,
  objectives: [
    "Compute nCr with Pascal's triangle in O(n²) with no division",
    "Precompute factorials and inverse factorials in O(n)",
    "Answer nCr queries in O(1) after that build",
    "Build the inverse factorial table with one exponentiation, not n",
    "Choose between the two approaches from the constraints",
  ],
  sections: [
    {
      id: "the-problem",
      heading: "Why nCr is awkward under a modulus",
      body: [
        "`nCr = n! / (r! · (n-r)!)`, and that formula has a division in it — the one operation that does not survive a modulus. Two ways round it.",
        "**Pascal's triangle** avoids division entirely: `C(n, r) = C(n-1, r-1) + C(n-1, r)`, which is only addition. Costs O(n²) time and O(n) space if you keep one row at a time. Right when n is small, or when you need a whole triangle anyway.",
        "**Factorials with inverse factorials** uses the formula directly, replacing the division with multiplication by a modular inverse. Costs O(n) to build and O(1) per query. Right when n is large or there are many queries — which is most of the time.",
      ],
    },
    {
      id: "both",
      heading: "Both, side by side",
      body: [
        "The second one contains a trick worth pointing at explicitly: the inverse factorial table is built **backwards** from a single exponentiation, rather than by inverting each factorial separately.",
      ],
      examples: [
        {
          id: "combinatorics",
          title: "Pascal's triangle, then O(1) queries",
          lang: "python",
          code: `MOD = 10**9 + 7

# Pascal's triangle: no division, no modular inverse needed
def pascal(rows):
    tri = [[1]]
    for r in range(1, rows):
        prev = tri[-1]
        row = [1] + [(prev[i] + prev[i + 1]) % MOD for i in range(len(prev) - 1)] + [1]
        tri.append(row)
    return tri

for row in pascal(6):
    print(" ".join(f"{v:3}" for v in row).center(28))

# factorials + inverse factorials: O(n) build, O(1) per query
N = 200000
fact = [1] * (N + 1)
for i in range(1, N + 1):
    fact[i] = fact[i - 1] * i % MOD

inv_fact = [1] * (N + 1)
inv_fact[N] = pow(fact[N], MOD - 2, MOD)
for i in range(N, 0, -1):
    inv_fact[i - 1] = inv_fact[i] * i % MOD

def nCr(n, r):
    if r < 0 or r > n:
        return 0
    return fact[n] * inv_fact[r] % MOD * inv_fact[n - r] % MOD

print("\\nC(5,2)      =", nCr(5, 2))
print("C(10,5)     =", nCr(10, 5))
print("C(100000,50000) mod M =", nCr(100000, 50000))
print("C(5,7)      =", nCr(5, 7), "(r > n)")

# checking the small ones against the real value
import math
print("\\nexact C(10,5) =", math.comb(10, 5))
print("row 5 of Pascal =", pascal(6)[5])`,
          output: `              1             
            1   1           
          1   2   1         
        1   3   3   1       
      1   4   6   4   1     
    1   5  10  10   5   1   

C(5,2)      = 10
C(10,5)     = 252
C(100000,50000) mod M = 149033233
C(5,7)      = 0 (r > n)

exact C(10,5) = 252
row 5 of Pascal = [1, 5, 10, 10, 5, 1]`,
          explanation:
            "The backwards inverse-factorial loop is the part worth understanding. Inverting each factorial separately would cost n exponentiations — O(n log m). Instead, invert only the *largest* one, then use `inv_fact[i-1] = inv_fact[i] * i`, which holds because `1/(i-1)! = (1/i!) · i`. One exponentiation and n multiplications: O(n + log m).\n\nThe `r < 0 or r > n` guard is not decoration. Without it, `inv_fact[n - r]` indexes with a negative number — which in Python silently reads from the end of the list and returns a plausible wrong answer, and in Java throws. Both are bad; the guard costs nothing.",
          alternates: [
            {
              lang: "javascript",
              code: `// BigInt for the modular arithmetic: fact[i-1] * i reaches 1e18, past 2^53.
const MOD = 10n ** 9n + 7n;

const center = (s, width) => {
  const left = Math.floor((width - s.length) / 2);
  return " ".repeat(left) + s + " ".repeat(width - s.length - left);
};
const pad3 = (v) => String(v).padStart(3);

// Pascal's triangle: no division, no modular inverse needed
function pascal(rows) {
  const tri = [[1n]];
  for (let r = 1; r < rows; r++) {
    const prev = tri[tri.length - 1];
    const row = [1n];
    for (let i = 0; i < prev.length - 1; i++) row.push((prev[i] + prev[i + 1]) % MOD);
    row.push(1n);
    tri.push(row);
  }
  return tri;
}

for (const row of pascal(6)) {
  console.log(center(row.map(pad3).join(" "), 28));
}

// factorials + inverse factorials: O(n) build, O(1) per query
const N = 200000;
const fact = new Array(N + 1).fill(1n);
for (let i = 1; i <= N; i++) fact[i] = (fact[i - 1] * BigInt(i)) % MOD;

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

const invFact = new Array(N + 1).fill(1n);
invFact[N] = power(fact[N], MOD - 2n, MOD);
for (let i = N; i > 0; i--) invFact[i - 1] = (invFact[i] * BigInt(i)) % MOD;

function nCr(n, r) {
  if (r < 0 || r > n) return 0n;
  return (((fact[n] * invFact[r]) % MOD) * invFact[n - r]) % MOD;
}

console.log("\\nC(5,2)      =", String(nCr(5, 2)));
console.log("C(10,5)     =", String(nCr(10, 5)));
console.log("C(100000,50000) mod M =", String(nCr(100000, 50000)));
console.log("C(5,7)      =", String(nCr(5, 7)), "(r > n)");

// checking the small ones against the real value
function comb(n, r) {
  let out = 1n;
  for (let i = 0; i < r; i++) out = (out * BigInt(n - i)) / BigInt(i + 1);
  return out;
}
console.log("\\nexact C(10,5) =", String(comb(10, 5)));
console.log("row 5 of Pascal =", "[" + pascal(6)[5].map(String).join(", ") + "]");`,
            },
            {
              lang: "typescript",
              code: `// BigInt for the modular arithmetic: fact[i-1] * i reaches 1e18, past 2^53.
const MOD = 10n ** 9n + 7n;

const center = (s: string, width: number): string => {
  const left = Math.floor((width - s.length) / 2);
  return " ".repeat(left) + s + " ".repeat(width - s.length - left);
};
const pad3 = (v: bigint): string => String(v).padStart(3);

// Pascal's triangle: no division, no modular inverse needed
function pascal(rows: number): bigint[][] {
  const tri: bigint[][] = [[1n]];
  for (let r = 1; r < rows; r++) {
    const prev = tri[tri.length - 1];
    const row: bigint[] = [1n];
    for (let i = 0; i < prev.length - 1; i++) row.push((prev[i] + prev[i + 1]) % MOD);
    row.push(1n);
    tri.push(row);
  }
  return tri;
}

for (const row of pascal(6)) {
  console.log(center(row.map(pad3).join(" "), 28));
}

// factorials + inverse factorials: O(n) build, O(1) per query
const N = 200000;
const fact: bigint[] = new Array(N + 1).fill(1n);
for (let i = 1; i <= N; i++) fact[i] = (fact[i - 1] * BigInt(i)) % MOD;

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

const invFact: bigint[] = new Array(N + 1).fill(1n);
invFact[N] = power(fact[N], MOD - 2n, MOD);
for (let i = N; i > 0; i--) invFact[i - 1] = (invFact[i] * BigInt(i)) % MOD;

function nCr(n: number, r: number): bigint {
  if (r < 0 || r > n) return 0n;
  return (((fact[n] * invFact[r]) % MOD) * invFact[n - r]) % MOD;
}

console.log("\\nC(5,2)      =", String(nCr(5, 2)));
console.log("C(10,5)     =", String(nCr(10, 5)));
console.log("C(100000,50000) mod M =", String(nCr(100000, 50000)));
console.log("C(5,7)      =", String(nCr(5, 7)), "(r > n)");

// checking the small ones against the real value
function comb(n: number, r: number): bigint {
  let out = 1n;
  for (let i = 0; i < r; i++) out = (out * BigInt(n - i)) / BigInt(i + 1);
  return out;
}
console.log("\\nexact C(10,5) =", String(comb(10, 5)));
console.log("row 5 of Pascal =", "[" + pascal(6)[5].map(String).join(", ") + "]");`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static final long MOD = 1_000_000_007L;
    static final int N = 200_000;

    static String center(String s, int width) {
        int left = (width - s.length()) / 2;
        return " ".repeat(left) + s + " ".repeat(width - s.length() - left);
    }

    /** Pascal's triangle: no division, no modular inverse needed */
    static List<long[]> pascal(int rows) {
        List<long[]> tri = new ArrayList<>();
        tri.add(new long[]{1});
        for (int r = 1; r < rows; r++) {
            long[] prev = tri.get(tri.size() - 1);
            long[] row = new long[prev.length + 1];
            row[0] = 1;
            row[row.length - 1] = 1;
            for (int i = 0; i < prev.length - 1; i++) row[i + 1] = (prev[i] + prev[i + 1]) % MOD;
            tri.add(row);
        }
        return tri;
    }

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

    static long[] fact = new long[N + 1];
    static long[] invFact = new long[N + 1];

    static long nCr(int n, int r) {
        if (r < 0 || r > n) return 0;
        return fact[n] * invFact[r] % MOD * invFact[n - r] % MOD;
    }

    public static void main(String[] args) {
        for (long[] row : pascal(6)) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < row.length; i++) {
                if (i > 0) sb.append(" ");
                sb.append(String.format("%3d", row[i]));
            }
            System.out.println(center(sb.toString(), 28));
        }

        // factorials + inverse factorials: O(n) build, O(1) per query
        fact[0] = 1;
        for (int i = 1; i <= N; i++) fact[i] = fact[i - 1] * i % MOD;
        invFact[N] = power(fact[N], MOD - 2, MOD);
        for (int i = N; i > 0; i--) invFact[i - 1] = invFact[i] * i % MOD;

        System.out.println("\\nC(5,2)      = " + nCr(5, 2));
        System.out.println("C(10,5)     = " + nCr(10, 5));
        System.out.println("C(100000,50000) mod M = " + nCr(100000, 50000));
        System.out.println("C(5,7)      = " + nCr(5, 7) + " (r > n)");

        // checking the small ones against the real value
        long exact = 1;
        for (int i = 0; i < 5; i++) exact = exact * (10 - i) / (i + 1);
        System.out.println("\\nexact C(10,5) = " + exact);
        long[] row5 = pascal(6).get(5);
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < row5.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(row5[i]);
        }
        System.out.println("row 5 of Pascal = " + sb.append("]"));
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

const long long MOD = 1000000007LL;
const int N = 200000;

string center(const string& s, int width) {
    int left = (width - (int)s.size()) / 2;
    return string(left, ' ') + s + string(width - (int)s.size() - left, ' ');
}

// Pascal's triangle: no division, no modular inverse needed
vector<vector<long long>> pascal(int rows) {
    vector<vector<long long>> tri = {{1}};
    for (int r = 1; r < rows; r++) {
        const auto& prev = tri.back();
        vector<long long> row = {1};
        for (size_t i = 0; i + 1 < prev.size(); i++) row.push_back((prev[i] + prev[i + 1]) % MOD);
        row.push_back(1);
        tri.push_back(row);
    }
    return tri;
}

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

vector<long long> fact(N + 1, 1), invFact(N + 1, 1);

long long nCr(int n, int r) {
    if (r < 0 || r > n) return 0;
    return fact[n] * invFact[r] % MOD * invFact[n - r] % MOD;
}

int main() {
    for (const auto& row : pascal(6)) {
        ostringstream line;
        for (size_t i = 0; i < row.size(); i++) {
            if (i) line << " ";
            line << setw(3) << row[i];
        }
        cout << center(line.str(), 28) << "\\n";
    }

    // factorials + inverse factorials: O(n) build, O(1) per query
    for (int i = 1; i <= N; i++) fact[i] = fact[i - 1] * i % MOD;
    invFact[N] = power(fact[N], MOD - 2, MOD);
    for (int i = N; i > 0; i--) invFact[i - 1] = invFact[i] * i % MOD;

    cout << "\\nC(5,2)      = " << nCr(5, 2) << "\\n";
    cout << "C(10,5)     = " << nCr(10, 5) << "\\n";
    cout << "C(100000,50000) mod M = " << nCr(100000, 50000) << "\\n";
    cout << "C(5,7)      = " << nCr(5, 7) << " (r > n)\\n";

    // checking the small ones against the real value
    long long exact = 1;
    for (int i = 0; i < 5; i++) exact = exact * (10 - i) / (i + 1);
    cout << "\\nexact C(10,5) = " << exact << "\\n";
    auto row5 = pascal(6)[5];
    cout << "row 5 of Pascal = [";
    for (size_t i = 0; i < row5.size(); i++) {
        if (i) cout << ", ";
        cout << row5[i];
    }
    cout << "]\\n";
}`,
            },
            {
              lang: "rust",
              code: `const MOD: i64 = 1_000_000_007;
const N: usize = 200_000;

fn center(s: &str, width: usize) -> String {
    let left = (width - s.len()) / 2;
    format!("{}{}{}", " ".repeat(left), s, " ".repeat(width - s.len() - left))
}

/// Pascal's triangle: no division, no modular inverse needed
fn pascal(rows: usize) -> Vec<Vec<i64>> {
    let mut tri: Vec<Vec<i64>> = vec![vec![1]];
    for _ in 1..rows {
        let prev = tri.last().unwrap().clone();
        let mut row = vec![1i64];
        for i in 0..prev.len().saturating_sub(1) {
            row.push((prev[i] + prev[i + 1]) % MOD);
        }
        row.push(1);
        tri.push(row);
    }
    tri
}

fn power(mut base: i64, mut exp: i64, mod_: i64) -> i64 {
    let mut result = 1i64;
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

fn n_cr(fact: &[i64], inv_fact: &[i64], n: usize, r: i64) -> i64 {
    if r < 0 || r > n as i64 {
        return 0;
    }
    let r = r as usize;
    fact[n] * inv_fact[r] % MOD * inv_fact[n - r] % MOD
}

fn main() {
    for row in pascal(6) {
        let line: Vec<String> = row.iter().map(|v| format!("{:3}", v)).collect();
        println!("{}", center(&line.join(" "), 28));
    }

    // factorials + inverse factorials: O(n) build, O(1) per query
    let mut fact = vec![1i64; N + 1];
    for i in 1..=N {
        fact[i] = fact[i - 1] * i as i64 % MOD;
    }
    let mut inv_fact = vec![1i64; N + 1];
    inv_fact[N] = power(fact[N], MOD - 2, MOD);
    for i in (1..=N).rev() {
        inv_fact[i - 1] = inv_fact[i] * i as i64 % MOD;
    }

    println!("\\nC(5,2)      = {}", n_cr(&fact, &inv_fact, 5, 2));
    println!("C(10,5)     = {}", n_cr(&fact, &inv_fact, 10, 5));
    println!("C(100000,50000) mod M = {}", n_cr(&fact, &inv_fact, 100000, 50000));
    println!("C(5,7)      = {} (r > n)", n_cr(&fact, &inv_fact, 5, 7));

    // checking the small ones against the real value
    let mut exact: i64 = 1;
    for i in 0..5 {
        exact = exact * (10 - i) / (i + 1);
    }
    println!("\\nexact C(10,5) = {}", exact);
    let row5: Vec<String> = pascal(6)[5].iter().map(|v| v.to_string()).collect();
    println!("row 5 of Pascal = [{}]", row5.join(", "));
}`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

const MOD int64 = 1_000_000_007
const N = 200_000

func center(s string, width int) string {
	left := (width - len(s)) / 2
	return strings.Repeat(" ", left) + s + strings.Repeat(" ", width-len(s)-left)
}

// Pascal's triangle: no division, no modular inverse needed
func pascal(rows int) [][]int64 {
	tri := [][]int64{{1}}
	for r := 1; r < rows; r++ {
		prev := tri[len(tri)-1]
		row := []int64{1}
		for i := 0; i+1 < len(prev); i++ {
			row = append(row, (prev[i]+prev[i+1])%MOD)
		}
		row = append(row, 1)
		tri = append(tri, row)
	}
	return tri
}

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

var fact = make([]int64, N+1)
var invFact = make([]int64, N+1)

func nCr(n, r int) int64 {
	if r < 0 || r > n {
		return 0
	}
	return fact[n] * invFact[r] % MOD * invFact[n-r] % MOD
}

func main() {
	for _, row := range pascal(6) {
		parts := make([]string, len(row))
		for i, v := range row {
			parts[i] = fmt.Sprintf("%3d", v)
		}
		fmt.Println(center(strings.Join(parts, " "), 28))
	}

	// factorials + inverse factorials: O(n) build, O(1) per query
	fact[0] = 1
	for i := 1; i <= N; i++ {
		fact[i] = fact[i-1] * int64(i) % MOD
	}
	invFact[N] = power(fact[N], MOD-2, MOD)
	for i := N; i > 0; i-- {
		invFact[i-1] = invFact[i] * int64(i) % MOD
	}

	fmt.Println("\\nC(5,2)      =", nCr(5, 2))
	fmt.Println("C(10,5)     =", nCr(10, 5))
	fmt.Println("C(100000,50000) mod M =", nCr(100000, 50000))
	fmt.Println("C(5,7)      =", nCr(5, 7), "(r > n)")

	// checking the small ones against the real value
	var exact int64 = 1
	for i := int64(0); i < 5; i++ {
		exact = exact * (10 - i) / (i + 1)
	}
	fmt.Println("\\nexact C(10,5) =", exact)
	row5 := pascal(6)[5]
	parts := make([]string, len(row5))
	for i, v := range row5 {
		parts[i] = fmt.Sprint(v)
	}
	fmt.Println("row 5 of Pascal = [" + strings.Join(parts, ", ") + "]")
}`,
            },
          ],
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing between them",
      body: [
        "**n ≤ 1000 and you want the whole triangle** — Pascal. Simpler, no inverses, no chance of a modulus bug.",
        "**n up to 10^6, many queries** — factorials. The build is one linear pass and every query is three array reads and two multiplications.",
        "**One query with an enormous n but a small r** — neither. Compute `n · (n-1) · ... · (n-r+1) / r!` directly with r terms, which is O(r) and does not need a table at all.",
        "**A non-prime modulus** — the inverse-factorial approach breaks, because Fermat needs a prime. Pascal still works, since it never divides.",
      ],
      pitfalls: [
        {
          title: "Sizing the table from n alone",
          body: "The table must be at least as large as the biggest argument you will ever pass, which is often `n + m` rather than `n` — grid-path problems ask for `C(rows + cols, rows)`. An index one past the end is the classic version of this bug and it only shows up on the largest test.",
        },
        {
          title: "Two multiplications need two reductions",
          body: "`fact[n] * inv_fact[r] % MOD * inv_fact[n-r] % MOD` reduces after each multiplication. Writing `fact[n] * inv_fact[r] * inv_fact[n-r] % MOD` multiplies three values under 10^9 together before reducing — around 10^27, which overflows a 64-bit integer and gives a wrong answer in every language except Python.",
        },
      ],
    },
  ],
  takeaways: [
    "Pascal's triangle needs only addition, so no modular inverse and no prime modulus",
    "Factorial tables give O(1) queries after an O(n) build",
    "Build inverse factorials backwards from one exponentiation, not n of them",
    "Guard `r < 0 or r > n` — a negative index silently misbehaves in Python",
    "Size the table for the largest argument, which is often n + m",
    "Reduce after every multiplication, not once at the end",
  ],
  status: "available",
};
