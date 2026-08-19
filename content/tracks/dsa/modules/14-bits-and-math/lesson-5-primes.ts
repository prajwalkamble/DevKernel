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
