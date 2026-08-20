import type { Lesson } from "@/content/types";

export const complementPatternLesson: Lesson = {
  id: "dsa-hash-complement",
  slug: "the-complement-pattern",
  moduleSlug: "hashing",
  title: "The Complement Pattern",
  summary:
    "While looking at x, the only thing that can complete it is target − x. Turning a search into a lookup is the single highest-yield move a hash map enables — and checking before inserting is what makes it correct.",
  estimatedMinutes: 30,
  objectives: [
    "Convert a nested-loop pair search into a single pass with a map",
    "Explain why the check must come before the insert",
    "Store the index rather than a boolean when the answer needs positions",
    "Recognise the pattern under its many disguises",
  ],
  sections: [
    {
      id: "the-move",
      heading: "Search becomes lookup",
      body: [
        "The brute force for \"two numbers that sum to target\" is two loops: for each `i`, scan every `j` after it. O(n²).",
        "The insight is that the inner loop is not really a search. Standing at `x`, there is exactly one value that would complete the pair: `target - x`. The inner loop is asking *have I seen this specific number before* — and that is a question a hash map answers in O(1).",
        "So walk the array once, keeping a map of everything seen so far. At each element, ask whether its complement is already in the map. One pass, O(n) time, O(n) space.",
        "This trade — a linear scan of memory in exchange for a linear scan of time — is the recurring bargain of this module.",
      ],
      examples: [
        {
          id: "two-sum",
          title: "Two Sum, the canonical form",
          lang: "python",
          code: `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []

print(two_sum([2, 7, 11, 15], 9))
print(two_sum([3, 3], 6))
print(two_sum([3, 2, 4], 6))`,
          output: `[0, 1]
[0, 1]
[1, 2]`,
          explanation:
            "The map stores **value → index**, not value → seen. A boolean would answer \"is there a pair?\" but the question asks for positions, and recovering them afterwards would cost another scan. Note the third case: `[3, 2, 4]` with target 6 must not pair 3 with itself — and it does not, because 3 is only inserted after its own check.",
        },
      ],
    },
    {
      id: "order-matters",
      heading: "Why the check comes first",
      body: [
        "Swap the two lines — insert first, then check — and `[3, 2, 4]` with target 6 returns `[0, 0]`. The 3 finds itself, because it was in the map before it asked.",
        "Checking first encodes a real constraint: *you may not use the same element twice*. The map holds strictly the elements to the left of the current one, so a hit is always a genuinely different position. No index comparison, no guard clause — the loop's shape enforces it.",
        "`[3, 3]` with target 6 shows the other half of the argument. The first 3 finds nothing and is stored. The second 3 looks up 6 − 3 = 3 and finds the *first* one. Two equal values pair correctly, because they occupy different positions.",
        "This is worth stating explicitly in an interview. \"I check before I insert so that an element cannot match itself, while two equal elements at different indices still pair\" is one sentence that answers the two follow-ups this problem always attracts.",
      ],
      pitfalls: [
        {
          title: "Inserting before checking",
          body: "The single most common bug in this pattern. It makes every element its own partner whenever `target` is `2 * x`, and it passes the first test case, which is what makes it dangerous.",
        },
        {
          title: "Storing a boolean when you need an index",
          body: "`seen = set()` is enough to answer *whether* a pair exists. If the answer is a pair of indices, you need a dict from value to index — deciding this up front avoids rewriting the loop halfway through.",
        },
        {
          title: "Overwriting an index you still need",
          body: "With duplicates, `seen[x] = i` keeps the most recent index. For Two Sum that is fine — any valid pair is accepted. For a problem that wants the *earliest* pair, guard with `if x not in seen`. Know which one the problem asked for.",
        },
        {
          title: "Sorting first out of habit",
          body: "Sorting makes the two-pointer solution available and destroys the indices. If the answer is positions, sorting costs you the thing you were asked for unless you carry the original indices alongside. If the answer is values, sorting is fine and uses O(1) extra space.",
        },
      ],
    },
    {
      id: "disguises",
      heading: "The same pattern wearing other clothes",
      body: [
        "**Contains Duplicate.** Have I seen this exact value before? A set, checked before insert.",
        "**Contains Nearby Duplicate.** Same, but the map stores the last index and you compare `i - seen[x] <= k`. The complement is a value; the constraint is a distance.",
        "**Four Sum II.** Two nested loops over the first pair building a map of sums, two more looking up `-(c + d)`. Turns O(n⁴) into O(n²) by applying the complement idea to *sums* rather than elements.",
        "**Subarray Sum Equals K.** The complement of a running prefix sum rather than of an element — lesson 7 gives it a lesson of its own, because it is the highest-yield variant.",
        "**Pairs with a given difference.** `x - k` and `x + k` instead of `target - x`. Same loop, different arithmetic.",
        "The recognisable shape is: *for each element, there is a small set of specific other values that would satisfy the condition*. When that is true, a map turns the inner loop into a lookup. When the condition is a range rather than a value — \"any partner within 10\" — a hash map cannot help and you want sorting or an ordered structure instead.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Why check the map before inserting the current element?",
      answer:
        "So an element cannot be its own partner. The map then holds only elements strictly to the left, which enforces \"not the same element twice\" structurally. Two equal values at different indices still pair, because the first is already stored when the second asks.",
    },
    {
      question: "Two Sum in O(n) time and O(1) space — possible?",
      answer:
        "Not if the answer must be indices in an unsorted array. Sorting enables the O(1)-space two-pointer version but destroys the positions unless you carry them, which costs O(n) again. If the input is already sorted, two pointers gives O(n) time and O(1) space.",
    },
    {
      question: "When does the complement pattern not apply?",
      answer:
        "When the condition is a range rather than an exact value — \"a partner within k\" — because a hash map can only answer exact-key questions. That is when you sort and use two pointers, or reach for an ordered structure with floor and ceiling queries.",
    },
  ],
  takeaways: [
    "Standing at x, the only completion is target − x — a lookup, not a search",
    "Check before you insert; the loop's shape then forbids self-pairing",
    "Store indices when the answer is positions, a set when it is existence",
    "Duplicates pair correctly because the earlier copy is already stored",
    "The pattern generalises to sums, differences and prefix sums",
    "Exact-value conditions suit hashing; range conditions want sorting",
  ],
  status: "available",
};
