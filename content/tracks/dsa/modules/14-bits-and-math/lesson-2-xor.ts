import type { Lesson } from "@/content/types";

export const xorLesson: Lesson = {
  id: "dsa-bits-xor",
  slug: "xor-and-the-problems-it-solves",
  moduleSlug: "bit-manipulation-and-math",
  title: "XOR, and the Problems It Solves",
  summary:
    "Three identities that look trivial and between them solve a family of problems whose optimal solutions otherwise look impossible — including finding two unpaired numbers among millions in one pass and no extra space.",
  estimatedMinutes: 30,
  objectives: [
    "State the three XOR identities and why they matter together",
    "Solve single-number and missing-number in one pass, O(1) space",
    "Split a list to find two unpaired values using one differing bit",
    "Recognise XOR as \"pairing off\" rather than as a bit operation",
  ],
  sections: [
    {
      id: "identities",
      heading: "Three identities, and what they mean together",
      body: [
        "XOR is one bit rule — *set if exactly one input is set* — and three consequences:",
        "**`a ^ a = 0`.** A value XORed with itself vanishes.",
        "**`a ^ 0 = a`.** Zero is the identity, so XORing something in and never cancelling it leaves it standing.",
        "**It is commutative and associative.** Order does not matter, at all.",
        "Put together, they say something stronger than any of them alone: **XOR over a collection cancels everything that appears an even number of times, regardless of order.** You do not have to sort, or group, or track what you have seen. Anything paired disappears; anything unpaired survives.",
        "That is the whole trick, and every problem below is an application of that one sentence.",
      ],
    },
    {
      id: "one-pass",
      heading: "The single-number family",
      body: [
        "Once you read XOR as \"pairing off\", three separate sheet problems collapse into the same loop.",
      ],
      examples: [
        {
          id: "xor-family",
          title: "One accumulator, three problems",
          lang: "python",
          code: `print("identities")
print("  a ^ a =", 5 ^ 5)
print("  a ^ 0 =", 5 ^ 0)
print("  commutative:", (3 ^ 5) ^ 7 == 3 ^ (5 ^ 7))

# single number: everything appears twice except one
a = [4, 1, 2, 1, 2]
acc = 0
for v in a:
    acc ^= v
print("\\nsingle number in", a, "->", acc)

# missing number from 0..n
nums = [3, 0, 1]
n = len(nums)
acc = n
for i, v in enumerate(nums):
    acc ^= i ^ v
print("missing from", nums, "->", acc)

# two numbers appear once, the rest twice
b = [1, 2, 1, 3, 2, 5]
x = 0
for v in b:
    x ^= v
print("\\nboth-uniques xor =", x, "=", format(x, "04b"))
bit = x & -x
print("a differing bit  =", format(bit, "04b"))
g1 = g2 = 0
for v in b:
    if v & bit:
        g1 ^= v
    else:
        g2 ^= v
print("split gives      ", sorted([g1, g2]))

# swap without a temporary
p, q = 9, 4
p ^= q
q ^= p
p ^= q
print("\\nxor swap:", p, q)`,
          output: `identities
  a ^ a = 0
  a ^ 0 = 5
  commutative: True

single number in [4, 1, 2, 1, 2] -> 4
missing from [3, 0, 1] -> 2

both-uniques xor = 6 = 0110
a differing bit  = 0010
split gives       [3, 5]

xor swap: 4 9`,
          explanation:
            "**Missing number** works because XORing every index together with every value pairs each present number with its own index, leaving only the index that has no value. **Two uniques** is the clever one and worth walking slowly: XOR everything and you get `a ^ b` for the two survivors, since everything else cancelled. Those two must differ somewhere — that is what makes them different numbers — so `x & -x` picks any one bit where they disagree. Partition the whole list on that bit and the two survivors are guaranteed to land in different halves, while every duplicate pair lands together in the same half and cancels. Two XOR accumulators, one pass, constant space.",
        },
      ],
    },
    {
      id: "against-alternatives",
      heading: "Why not a hash set, or a sum?",
      body: [
        "A `HashSet` solves single-number and missing-number too, in O(n) time — but in **O(n) space**, and with the constant factor of hashing every element. XOR is O(1) space and one instruction per element. When an interviewer says \"now do it without extra space\", XOR is the answer they are waiting for.",
        "A **sum** also works for missing-number: add up `0..n`, subtract what you have. It reads more naturally, and it has one real weakness — the sum can overflow where the XOR cannot, because XOR never produces a value wider than its inputs. For `n = 10^5` the sum is fine; for `n` near the width of the type it is not. This is the same trade the cyclic-sort lesson made, seen from the other side.",
      ],
      pitfalls: [
        {
          title: "The XOR swap is a party trick, not a technique",
          body: "`p ^= q; q ^= p; p ^= q` swaps without a temporary, and you should never write it in real code. It is slower than a temporary on any modern compiler, it is harder to read, and it silently zeroes the value if both operands are the *same variable* — `swap(a[i], a[i])` destroys the element. Know it because it gets asked; use a temporary because it works.",
        },
        {
          title: "XOR only cancels *even* counts",
          body: "\"Everything appears twice except one\" is the precondition, and it matters. If a value appears three times it survives, and if two different values each appear once you get their XOR rather than either of them. Check what the problem actually guarantees before reaching for this.",
        },
      ],
    },
  ],
  takeaways: [
    "`a ^ a = 0`, `a ^ 0 = a`, and order does not matter",
    "XOR over a collection cancels everything appearing an even number of times",
    "Single number, missing number and two-uniques are one idea in three costumes",
    "`x & -x` picks a bit where two surviving values differ, which partitions them",
    "XOR beats a sum because it cannot overflow, and beats a set because it needs no space",
    "The XOR swap is interview trivia — use a temporary",
  ],
  status: "available",
};
