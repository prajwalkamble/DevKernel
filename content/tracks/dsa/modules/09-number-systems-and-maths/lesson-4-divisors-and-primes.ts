import type { Lesson } from "@/content/types";

export const divisorsAndPrimesLesson: Lesson = {
  id: "dsa-math-primes",
  slug: "divisors-and-primes",
  moduleSlug: "number-systems-and-maths",
  title: "Divisors, Primes & the √n Insight",
  summary:
    "Why you only ever have to check up to the square root, the trial-division and sieve algorithms, and prime factorisation in a dozen lines.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Prove to yourself why divisors come in pairs around √n",
    "Find all divisors of a number in O(√n)",
    "Test primality by trial division and generate primes with a sieve",
    "Factorise a number into primes, and know when each method is right",
  ],
  sections: [
    {
      id: "sqrt-insight",
      heading: "The √n insight",
      body: [
        "**Divisors come in pairs.** If d divides n, so does n/d, and they multiply to n. For 36: 1×36, 2×18, 3×12, 4×9, 6×6.",
        "In every pair, one member is at most √n and the other is at least √n — because if both were larger than √n their product would exceed n, and if both were smaller it would fall short.",
        "So **checking d from 1 to √n finds every pair.** You get the small member by division and the large member for free as `n // d`. That turns an O(n) scan into O(√n), which for n = 10⁶ is a thousand steps instead of a million.",
        "This one observation underlies divisor enumeration, primality testing and factorisation. It is the single highest-value fact in this lesson.",
      ],
      examples: [
        {
          id: "divisors",
          title: "All divisors in O(√n)",
          lang: "python",
          code: `def divisors_naive(n):
    return [d for d in range(1, n + 1) if n % d == 0]


def divisors_sqrt(n):
    small, large = [], []
    d = 1
    while d * d <= n:
        if n % d == 0:
            small.append(d)
            if d != n // d:
                large.append(n // d)
        d += 1
    return small + large[::-1]


for n in (36, 37, 100, 1):
    print(f"{n:>4}: {divisors_sqrt(n)}")

print("agrees with the naive version for every n up to 2000:",
      all(divisors_sqrt(n) == divisors_naive(n) for n in range(1, 2001)))

print()
print("work done for n = 1,000,000:")
print("  naive:", 1_000_000, "iterations")
print("  sqrt :", int(1_000_000 ** 0.5), "iterations")`,
          output: `  36: [1, 2, 3, 4, 6, 9, 12, 18, 36]
  37: [1, 37]
 100: [1, 2, 4, 5, 10, 20, 25, 50, 100]
   1: [1]
agrees with the naive version for every n up to 2000: True

work done for n = 1,000,000:
  naive: 1000000 iterations
  sqrt : 1000 iterations`,
          explanation:
            "Two details make it correct. The `d != n // d` guard stops a perfect square from listing its root twice — 100 would otherwise contain 10 twice. And the large list is reversed before appending, so the result comes out sorted, which is usually what a problem wants. Note the loop condition is `d * d <= n`, not `d <= sqrt(n)`: it uses integer multiplication instead of a floating-point square root, which sidesteps the rounding issue from the digit-counting lesson.",
        },
      ],
      pitfalls: [
        {
          title: "Using `d <= math.sqrt(n)` as the loop condition",
          body: "`math.sqrt` returns a float, and for a large perfect square the result can be a hair under the true root — so the root itself gets skipped and a divisor is lost. `d * d <= n` is exact, and in Python `math.isqrt(n)` is exact too. In Java, `d <= n / d` is the equivalent integer-only form.",
        },
      ],
    },
    {
      id: "primality",
      heading: "Primality by trial division",
      body: [
        "A prime has exactly two divisors: 1 and itself. So `n` is prime when the √n scan finds no divisor strictly between them.",
        "**The definition excludes 1**, which has only one divisor. It is neither prime nor composite, and treating it as prime is the most common bug in this function. Negative numbers and zero are also not prime.",
        "Two easy speedups: handle 2 separately and then check only odd divisors, which halves the work; and stop at √n rather than n/2, which is the real win.",
        "Cost is O(√n) per number. Fine for one number, wasteful for a range — for that, use a sieve.",
      ],
      examples: [
        {
          id: "primality",
          title: "Trial division, and the sieve for a range",
          lang: "python",
          code: `def is_prime(n):
    if n < 2:
        return False
    if n < 4:
        return True
    if n % 2 == 0:
        return False
    d = 3
    while d * d <= n:
        if n % d == 0:
            return False
        d += 2
    return True


print("primes below 50:", [n for n in range(50) if is_prime(n)])
print("edge cases:", [(n, is_prime(n)) for n in (-7, 0, 1, 2, 3, 4)])
print("large prime 1000003:", is_prime(1000003))
print("large composite 1000001:", is_prime(1000001), "= 101 * 9901")


def sieve(limit):
    flags = [True] * (limit + 1)
    flags[0] = flags[1] = False
    p = 2
    while p * p <= limit:
        if flags[p]:
            for multiple in range(p * p, limit + 1, p):
                flags[multiple] = False
        p += 1
    return [i for i, ok in enumerate(flags) if ok]


s = sieve(50)
print("sieve to 50:", s)
print("matches the trial-division list:", s == [n for n in range(51) if is_prime(n)])
print("primes below 1,000,000:", len(sieve(1_000_000)))`,
          output: `primes below 50: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
edge cases: [(-7, False), (0, False), (1, False), (2, True), (3, True), (4, False)]
large prime 1000003: True
large composite 1000001: False = 101 * 9901
sieve to 50: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
matches the trial-division list: True
primes below 1,000,000: 78498`,
          explanation:
            "Two details in the sieve are worth naming. Marking starts at **p × p**, not 2p, because every smaller multiple of p has a smaller prime factor and was already crossed off. And the outer loop stops at √limit for the same reason the trial division does. The result — 78,498 primes below a million, computed in well under a second — is what makes a sieve the right answer whenever you need many primality answers rather than one.",
        },
      ],
      pitfalls: [
        {
          title: "Treating 1 as prime",
          body: "It is not: a prime needs exactly two distinct divisors and 1 has one. Excluding it is not a convention of convenience — it is what makes prime factorisation unique, since otherwise you could insert any number of 1s. Every primality function must start with `if n < 2: return False`.",
        },
      ],
    },
    {
      id: "factorisation",
      heading: "Prime factorisation",
      body: [
        "Every integer above 1 factors into primes in exactly one way — the fundamental theorem of arithmetic. Finding that factorisation is a dozen lines using the same √n bound.",
        "Divide out each candidate factor **as many times as it goes**, then move on. Because you always divide out the smallest remaining factor first, any divisor you find is automatically prime — the composites have already been stripped away.",
        "The one non-obvious line is the ending: after the loop, if what remains is above 1, that remainder is itself a prime and must be appended. Without it, `prime_factors(97)` returns an empty list.",
      ],
      examples: [
        {
          id: "factorise",
          title: "Factorisation, checked by multiplying back",
          lang: "python",
          code: `def prime_factors(n):
    factors = []
    d = 2
    while d * d <= n:
        while n % d == 0:
            factors.append(d)
            n //= d
        d += 1
    if n > 1:
        factors.append(n)
    return factors


for n in (360, 97, 1024, 1, 1000003):
    f = prime_factors(n)
    product = 1
    for x in f:
        product *= x
    print(f"{n:>8} = {' x '.join(map(str, f)) or '(empty)':<24} product {product}")`,
          output: `     360 = 2 x 2 x 2 x 3 x 3 x 5    product 360
      97 = 97                       product 97
    1024 = 2 x 2 x 2 x 2 x 2 x 2 x 2 x 2 x 2 x 2 product 1024
       1 = (empty)                  product 1
 1000003 = 1000003                  product 1000003`,
          explanation:
            "Multiplying the factors back is the check that costs nothing and catches everything. Note 1 correctly yields an empty list — it is the empty product, which is 1 — and 97 and 1000003 are picked up entirely by the trailing `if n > 1`, since the loop finds no factor at all for a prime. That trailing clause is the line people forget.",
        },
      ],
      pitfalls: [
        {
          title: "Forgetting the remaining factor after the loop",
          body: "The loop only runs while `d * d <= n`, and `n` shrinks as factors are divided out. When the remainder is a prime larger than its own square root — which is every prime — the loop exits without recording it. The `if n > 1: factors.append(n)` line is not an edge case, it is the main path for half the inputs.",
        },
      ],
    },
    {
      id: "choosing",
      heading: "Choosing between them",
      body: [
        "**One primality question, possibly on a large number:** trial division, O(√n). No setup, no memory.",
        "**Many primality questions in a bounded range:** a sieve, O(n log log n) once, then O(1) per query. Costs O(n) memory, which caps it around 10⁷ or 10⁸ elements.",
        "**All divisors of one number:** the paired √n scan.",
        "**Factorising many numbers in a range:** a modified sieve that records each number's *smallest prime factor*, after which any number factorises in O(log n) lookups.",
        "The general shape here is the space-for-time trade from the complexity lessons: pay once up front to make every subsequent query cheap. Recognising when a problem asks the same question many times is what tells you which side to take.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why is it enough to check divisors up to √n?",
      answer:
        "Because divisors come in pairs multiplying to n, and in every pair one member is at most √n while the other is at least √n — if both exceeded √n their product would exceed n. So scanning up to √n encounters every pair at least once, and the partner comes free as `n // d`. It reduces divisor finding and primality testing from O(n) to O(√n): a thousand steps instead of a million for n = 10⁶.",
    },
    {
      question: "Why does the Sieve of Eratosthenes start marking at p × p?",
      answer:
        "Because every multiple of p below p² has a prime factor smaller than p and has therefore already been crossed off by that smaller prime. Starting at 2p would be correct but would redo work. For the same reason, the outer loop can stop once p² exceeds the limit — anything still unmarked past that point has no factor left that could mark it. The sieve is O(n log log n) overall.",
    },
    {
      question: "When would you use a sieve rather than trial division?",
      answer:
        "When you need primality for many numbers in a bounded range rather than one number. Trial division is O(√n) per query with no setup; the sieve is O(n log log n) once and then O(1) per query, at the cost of O(n) memory, which caps the range around 10⁷ or 10⁸. One large primality test favours trial division; a million queries below a million strongly favours the sieve.",
    },
  ],
  takeaways: [
    "Divisors pair up as d and n/d, so one of every pair is at most √n",
    "Use `d * d <= n`, not a floating-point square root, as the loop bound",
    "Guard `d != n // d` so a perfect square does not list its root twice",
    "1 is not prime — a prime has exactly two divisors, and that is what makes factorisation unique",
    "Trial division is O(√n) per query; the sieve is O(n log log n) once, then O(1)",
    "The sieve starts marking at p × p because smaller multiples were already crossed off",
    "In factorisation, divide out each factor fully; the smallest remaining divisor is always prime",
    "Append the remainder after the loop — that line handles every prime input",
  ],
};
