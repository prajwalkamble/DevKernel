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
