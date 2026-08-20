import type { Lesson } from "@/content/types";

export const thePrefixArrayLesson: Lesson = {
  id: "dsa-ps-array",
  slug: "the-prefix-array-and-the-leading-zero",
  moduleSlug: "prefix-sums-and-range-queries",
  title: "The Prefix Array & the Leading Zero",
  summary:
    "One pass of precomputation turns every range-sum query into a single subtraction. The array is one element longer than the input, and that extra leading zero is not padding — it is what removes an edge case from every query you will ever write.",
  estimatedMinutes: 25,
  objectives: [
    "Build a prefix array with the leading-zero convention",
    "Answer a range sum in O(1) and get the indices right",
    "Explain what the leading zero buys",
    "Say when precomputation pays for itself",
    "State why prefix products are a trap",
  ],
  sections: [
    {
      id: "the-trade",
      heading: "Pay once, answer forever",
      body: [
        "Answering *q* range-sum queries by looping over each range costs O(q · n). Precomputing prefix sums costs O(n) once and then O(1) per query — total O(n + q).",
        "For one query the precomputation is wasted. For a thousand queries on a million elements it is the difference between a second and a fortnight. The pattern is worth recognising as a *trade* rather than a trick: you are buying query speed with a linear setup.",
      ],
      examples: [
        {
          id: "prefix",
          title: "The array, the queries, and the product trap",
          lang: "python",
          code: `def build_prefix(a):
    """prefix[i] is the sum of the first i elements. prefix[0] = 0."""
    prefix = [0] * (len(a) + 1)
    for i, v in enumerate(a):
        prefix[i + 1] = prefix[i] + v
    return prefix

a = [3, 1, 4, 1, 5, 9, 2, 6]
p = build_prefix(a)
print("array :", a)
print("prefix:", p, " (length", len(p), "=", len(a), "+ 1)")

print("\\nrange sums, a[lo:hi] = prefix[hi] - prefix[lo]:")
for lo, hi in ((0, 3), (2, 6), (0, 8), (4, 5), (3, 3)):
    print(f"  a[{lo}:{hi}] = {a[lo:hi]!s:18} sum {p[hi] - p[lo]:3}"
          f"  (check {sum(a[lo:hi]):3})")

# the leading zero is what removes the special case
print("\\nwithout the leading zero you would need:")
print("  sum(lo..hi) = prefix[hi] - (prefix[lo-1] if lo > 0 else 0)")
print("with it, every query is one subtraction and lo == 0 is not special.")

# range products, and the zero problem
def build_products(a):
    prod = [1] * (len(a) + 1)
    for i, v in enumerate(a):
        prod[i + 1] = prod[i] * v
    return prod

b = [2, 3, 4, 5]
q = build_products(b)
print("\\nproducts of", b, "->", q)
print("  product b[1:3] =", q[3] // q[1], " (check", 3 * 4, ")")

c = [2, 0, 4, 5]
r = build_products(c)
print("\\nwith a zero:", c, "->", r)
print("  product c[2:4] would be r[4] // r[2] -> division by zero")
print("  prefix products only work when no element is zero, and only for")
print("  exact division — which floats do not give you.")`,
          output: `array : [3, 1, 4, 1, 5, 9, 2, 6]
prefix: [0, 3, 4, 8, 9, 14, 23, 25, 31]  (length 9 = 8 + 1)

range sums, a[lo:hi] = prefix[hi] - prefix[lo]:
  a[0:3] = [3, 1, 4]          sum   8  (check   8)
  a[2:6] = [4, 1, 5, 9]       sum  19  (check  19)
  a[0:8] = [3, 1, 4, 1, 5, 9, 2, 6] sum  31  (check  31)
  a[4:5] = [5]                sum   5  (check   5)
  a[3:3] = []                 sum   0  (check   0)

without the leading zero you would need:
  sum(lo..hi) = prefix[hi] - (prefix[lo-1] if lo > 0 else 0)
with it, every query is one subtraction and lo == 0 is not special.

products of [2, 3, 4, 5] -> [1, 2, 6, 24, 120]
  product b[1:3] = 12  (check 12 )

with a zero: [2, 0, 4, 5] -> [1, 2, 0, 0, 0]
  product c[2:4] would be r[4] // r[2] -> division by zero
  prefix products only work when no element is zero, and only for
  exact division — which floats do not give you.`,
          explanation:
            "Note the empty range: `a[3:3]` gives 0 with no special handling, because `p[3] - p[3]` is zero by construction. Every convention question — is the range inclusive, what about an empty one, what about starting at index 0 — answers itself once the array is half-open and one longer than the input.",
        },
      ],
      visual: {
        id: "prefix-visual",
        kind: "pattern",
        algorithm: "prefix",
        lockAlgorithm: true,
        title: "Building the prefix array, then querying it",
      },
    },
    {
      id: "the-leading-zero",
      heading: "Why the leading zero",
      body: [
        "Define `prefix[i]` as the sum of the **first i elements**, so `prefix[0] = 0` — the sum of nothing. Then the sum of the half-open range `a[lo:hi]` is exactly `prefix[hi] - prefix[lo]`, with no conditions.",
        "The alternative — `prefix[i]` meaning the sum up to *and including* index i — needs `prefix[hi] - prefix[lo - 1]`, and `lo == 0` reads `prefix[-1]`. In Python that silently returns the *last* element of the array, which is a wrong answer rather than an error. In Java it throws.",
        "The half-open convention also matches how `a[lo:hi]`, `subList`, and `substring` already work in every language on this site, so the indices in your head match the indices in the code.",
      ],
      pitfalls: [
        {
          title: "Mixing inclusive and half-open in the same function",
          body: "Problems usually state ranges inclusively — \"the sum from index l to index r\". Convert once, at the boundary: `p[r + 1] - p[l]`. Write the conversion down rather than deriving it each time, because deriving it under pressure is where the off-by-one comes from.",
        },
        {
          title: "Prefix products",
          body: "They need division to invert, and division fails on a zero and loses precision on floats. The standard workaround for \"product of array except self\" is not a prefix-product array at all — it is a prefix pass and a suffix pass multiplied together, which never divides.",
        },
        {
          title: "Overflow",
          body: "The last prefix entry is the sum of the whole array. For 10⁵ elements of 10⁹ that is 10¹⁴, which needs a `long` in Java, C++ and Go. This is the width question from the bits-and-math module, and it is the most common way a correct prefix solution still fails.",
        },
      ],
    },
  ],
  takeaways: [
    "Precompute in O(n), then answer each range query in O(1)",
    "`prefix[i]` is the sum of the first i elements, so `prefix[0] = 0`",
    "`sum(a[lo:hi]) = prefix[hi] - prefix[lo]`, with no special case for `lo == 0`",
    "The array is one element longer than the input",
    "Convert inclusive problem indices once, at the boundary",
    "Prefix products need division and break on zeros — use prefix-and-suffix instead",
    "The final prefix is the whole-array sum; check whether it needs 64 bits",
  ],
  status: "available",
};
