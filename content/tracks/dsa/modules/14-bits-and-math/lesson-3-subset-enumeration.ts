import type { Lesson } from "@/content/types";

export const subsetEnumerationLesson: Lesson = {
  id: "dsa-bits-subsets",
  slug: "enumerating-subsets",
  moduleSlug: "bit-manipulation-and-math",
  title: "Enumerating Subsets Efficiently",
  summary:
    "Counting from 0 to 2^n gives you every subset. A three-token loop gives you every subset of a *given* subset. And the total cost of the second one over all masks is 3^n, not 4^n — which is the difference between a solution that passes and one that does not.",
  estimatedMinutes: 30,
  objectives: [
    "Enumerate all 2^n subsets by counting",
    "Enumerate the submasks of a mask with `(sub - 1) & mask`",
    "Prove the total submask work over all masks is 3^n",
    "Recognise bitmask DP from the constraints",
  ],
  sections: [
    {
      id: "counting",
      heading: "Counting is enumerating",
      body: [
        "Every integer from `0` to `2^n - 1` is a distinct subset of an n-element set, and counting visits each exactly once. There is nothing more to it — no recursion, no backtracking, no visited set.",
      ],
      examples: [
        {
          id: "subsets",
          title: "All subsets, then all submasks of one mask",
          lang: "python",
          code: `# every subset of a 3-element set
items = ["a", "b", "c"]
n = len(items)
print("all subsets of", items)
for mask in range(1 << n):
    chosen = [items[i] for i in range(n) if mask & (1 << i)]
    print(f"  {mask:03b} -> {chosen}")

# submask enumeration: every subset of a given mask, descending
mask = 0b1011
print(f"\\nsubmasks of {mask:04b}")
sub = mask
subs = []
while True:
    subs.append(sub)
    if sub == 0:
        break
    sub = (sub - 1) & mask
print("  ", " ".join(format(s, "04b") for s in subs))
print("   count:", len(subs), "= 2^(popcount) =", 1 << bin(mask).count("1"))

# why the total over all masks is 3^n, not 4^n
total = 0
for m in range(1 << 4):
    s = m
    while True:
        total += 1
        if s == 0:
            break
        s = (s - 1) & m
print("\\nsubmask pairs for n=4:", total, " 3^4 =", 3 ** 4)`,
          output: `all subsets of ['a', 'b', 'c']
  000 -> []
  001 -> ['a']
  010 -> ['b']
  011 -> ['a', 'b']
  100 -> ['c']
  101 -> ['a', 'c']
  110 -> ['b', 'c']
  111 -> ['a', 'b', 'c']

submasks of 1011
   1011 1010 1001 1000 0011 0010 0001 0000
   count: 8 = 2^(popcount) = 8

submask pairs for n=4: 81  3^4 = 81`,
          explanation:
            "The submask loop is the part worth understanding rather than memorising. `sub - 1` borrows through the trailing zeros, and `& mask` immediately discards any bit that was not in `mask` to begin with — so the result is the next-smallest submask, every time. It visits exactly the `2^popcount(mask)` submasks in descending order and stops at zero. The `if sub == 0: break` at the *bottom* rather than the top is deliberate: the empty submask is a legitimate subset and a top-tested loop would skip it.",
        },
      ],
    },
    {
      id: "three-to-the-n",
      heading: "Why the total is 3^n",
      body: [
        "The nested loop above looks like it should cost `2^n` masks times `2^n` submasks each — `4^n`, which for n = 20 is a trillion and hopeless. The measured answer for n = 4 is 81, which is exactly `3^n`.",
        "The counting argument is one line. A pair `(mask, submask)` is determined by deciding, for **each of the n elements independently**, one of three things: it is in the submask, or it is in the mask but not the submask, or it is in neither. Three choices, n elements, `3^n` pairs. There is no fourth option, because a submask cannot contain an element its mask does not.",
        "For n = 20 that is 3.5 billion rather than a trillion — still large, but the difference between \"tight but feasible in C++\" and \"impossible\". This bound is the reason subset-sum-over-subsets DP is a known technique rather than a curiosity.",
      ],
    },
    {
      id: "recognising",
      heading: "Recognising bitmask DP",
      body: [
        "The constraint is the giveaway, and it is unusually specific. **`n ≤ 20`** with a question about assignments, orderings, or covering — that is `2^n` states, and each state is a subset of things already used.",
        "The canonical shape is *assignment*: n tasks, n workers, a cost for each pairing, minimise the total. The state is \"which tasks are done\", the transition assigns the next worker to any remaining task, and the answer is at the full mask. Travelling salesman on 20 cities is the same skeleton with an extra dimension for the current city.",
        "The reason it works is that a subset carries all the information you need: *which* elements are used matters, and the order they were used in does not. If order does matter, a bitmask is not enough on its own.",
      ],
      pitfalls: [
        {
          title: "`for (int sub = mask; sub; sub = (sub - 1) & mask)` skips the empty set",
          body: "The idiomatic C++ one-liner tests `sub` at the top, so it stops before visiting zero. That is often what you want, and occasionally a silent bug. If the empty submask is a valid case, handle it outside the loop or restructure as the do-while shape above.",
        },
        {
          title: "`1 << n` overflows for n ≥ 31",
          body: "In Java and C++ this is an `int` shift, and `1 << 31` is negative. A problem with `n ≤ 20` never hits it, but a solution generalised carelessly will. Use `1L << n` if there is any doubt.",
        },
      ],
    },
  ],
  takeaways: [
    "Counting 0 to 2^n - 1 enumerates every subset, once each",
    "`sub = (sub - 1) & mask` walks the submasks of a mask in descending order",
    "Test for zero at the bottom of the loop or the empty submask is skipped",
    "The total submask work over all masks is 3^n, by a three-choices-per-element argument",
    "`n ≤ 20` plus assignment, ordering or covering means bitmask DP",
    "A bitmask records *which*, not *in what order*",
  ],
  status: "available",
};
