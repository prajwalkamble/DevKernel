import type { Lesson } from "@/content/types";

export const onTheAnswerLesson: Lesson = {
  id: "dsa-bs-answer",
  slug: "binary-search-on-the-answer",
  moduleSlug: "binary-search",
  title: "Binary Search on the Answer",
  summary:
    "The technique that solves a family of problems which contain no sorted array and often no array at all. You stop searching the input and start searching the range of possible answers.",
  estimatedMinutes: 40,
  objectives: [
    "Recognise \"the minimum X such that…\" as the signal it is",
    "Write a feasibility check and argue that it is monotone",
    "Choose bounds guaranteed to contain the answer",
    "Return the boundary rather than a found value",
    "Compute the total complexity, including the check",
  ],
  sections: [
    {
      id: "the-reframe",
      heading: "The answer space is the array",
      body: [
        "Here is the shape. *Koko eats bananas from n piles. She picks an eating speed k, and each hour eats up to k bananas from one pile. What is the smallest k that finishes every pile within h hours?*",
        "There is no sorted array. There is nothing obvious to binary search. But look at the **set of possible answers**: the speed is an integer somewhere between 1 and `max(piles)`. That is a range. And the crucial property is that if speed 20 works, speed 21 certainly does — a faster eater never fails a deadline a slower one met.",
        "So the *feasibility* of each candidate speed, laid out in order, looks like `F F F F T T T T`. Finding the boundary between the last F and the first T is exactly `lower_bound`. **That is the whole technique**: binary search the answer range on a predicate rather than the input on a value.",
      ],
    },
    {
      id: "recipe",
      heading: "The recipe, in four questions",
      body: [
        "**1. What is the answer?** A single number. Name it and its units — a speed, a capacity, a day index, a length.",
        "**2. What is `feasible(x)`?** A boolean: \"can the goal be met with x?\" Write it as an ordinary function that solves the *easy* direction. It usually costs O(n) and is usually a simple loop.",
        "**3. Is it monotone?** Once true, always true as x increases — or the reverse. This is the step people skip, and skipping it is how you get a solution that passes samples and fails everything else. Say out loud why a larger x cannot un-solve the problem.",
        "**4. What are the bounds?** `lo` must be low enough that failure is allowed, `hi` high enough that success is guaranteed. Be generous; an extra factor of two costs one iteration.",
      ],
      examples: [
        {
          id: "answer-space",
          title: "Two problems, one shape",
          lang: "python",
          code: `import math

# Binary search on the answer: the array is the ANSWER SPACE, not the input.

def koko(piles, hours):
    """Minimum eating speed to finish every pile within \`hours\`."""
    def feasible(speed):
        return sum(math.ceil(p / speed) for p in piles) <= hours

    lo, hi = 1, max(piles)          # speed 1 is slowest useful, max(piles) always works
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if feasible(mid):
            hi = mid                # mid works; look for something smaller
        else:
            lo = mid + 1            # mid too slow
    return lo

piles = [30, 11, 23, 4, 20]
print("piles:", piles)
for h in (5, 6, 8, 88):
    print(f"  within {h:2}h -> speed {koko(piles, h)}")

# the feasibility table is monotone: once true, always true
print("\\nfeasibility for h=6, speed 18..27 — false then true, never back:")
def feasible_at(speed, piles=piles, hours=6):
    return sum(math.ceil(p / speed) for p in piles) <= hours
print("  " + " ".join(f"{s:2}" for s in range(18, 28)))
print("  " + " ".join(" T" if feasible_at(s) else " F" for s in range(18, 28)))

def ship_within_days(weights, days):
    """Least capacity that ships everything in order within \`days\`."""
    def feasible(cap):
        need, load = 1, 0
        for w in weights:
            if load + w > cap:
                need += 1
                load = 0
            load += w
        return need <= days

    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo

w = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
print("\\nweights:", w)
for d in (5, 4, 3, 1):
    print(f"  in {d} days -> capacity {ship_within_days(w, d)}")`,
          output: `piles: [30, 11, 23, 4, 20]
  within  5h -> speed 30
  within  6h -> speed 23
  within  8h -> speed 15
  within 88h -> speed 1

feasibility for h=6, speed 18..27 — false then true, never back:
  18 19 20 21 22 23 24 25 26 27
   F  F  F  F  F  T  T  T  T  T

weights: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  in 5 days -> capacity 15
  in 4 days -> capacity 17
  in 3 days -> capacity 21
  in 1 days -> capacity 55

`,
          explanation:
            "The printed table is the point of the whole lesson. Feasibility goes false, false, false, then true and never back — and 23 is where it flips, which is exactly the answer. If that table ever read `F T F T`, binary search would be *invalid* here and would return an arbitrary one of the true entries.\n\nNotice the bounds in the shipping problem. `lo = max(weights)` because a capacity below the heaviest single package can never ship it at all — not \"probably fine\", but provably necessary. `hi = sum(weights)` ships everything in one day, so it always works. Both are chosen by argument rather than by guessing.\n\nThe loop is `lower_bound` with `feasible(mid)` in place of `a[mid] >= target`. Same three lines, same convention, and the answer is `lo` when the window closes — never a value you returned from inside the loop.",
        },
      ],
    },
    {
      id: "complexity",
      heading: "The complexity, and why it is usually fine",
      body: [
        "The search runs `log(hi - lo)` iterations, and each one calls `feasible`, which is usually O(n). So the total is **O(n log(range))**.",
        "The range is over *values*, not elements, and that is a feature. Searching a billion possible speeds is thirty iterations. A problem with n = 10⁵ and answers up to 10⁹ costs about `10^5 × 30 = 3 × 10^6` operations — comfortable, where enumerating the answers would be 10¹⁴ and hopeless.",
        "This is also why a slightly loose upper bound is harmless. Doubling `hi` adds exactly one iteration.",
      ],
      pitfalls: [
        {
          title: "Not checking monotonicity",
          body: "This is the failure mode, and it is silent. If `feasible` is not monotone, binary search still terminates and still returns something — an arbitrary boundary in a jagged table. Before writing the loop, state the reason a larger x cannot break what a smaller one achieved. If you cannot, the technique does not apply.",
        },
        {
          title: "Returning from inside the loop",
          body: "There is no equality test here — no candidate is \"the\" answer in the way `a[mid] == target` is. Let the window close and return `lo`. Code that tracks a `best` variable and returns it works too, but it is more state to get wrong.",
        },
        {
          title: "Bounds that exclude the answer",
          body: "`lo = 0` for a speed produces a division by zero; `hi = max(piles)` would be wrong if the goal were bananas-per-hour across all piles rather than one. Derive both ends from the problem, and prefer a generous `hi` — it costs one iteration and removes a whole class of bug.",
        },
      ],
    },
    {
      id: "the-family",
      heading: "The family",
      body: [
        "Once you see the shape, the sheet collapses. **Koko Eating Bananas** — minimise speed. **Capacity to Ship Packages Within D Days** — minimise capacity. **Split Array Largest Sum** — minimise the largest part; the feasibility check greedily fills parts. **Minimum Number of Days to Make M Bouquets** — minimise the day; feasibility scans for runs of bloomed flowers. **Aggressive Cows / Magnetic Force Between Balls** — *maximise* the minimum distance, which is the mirror image: the table reads `T T T F F` and you search for the last true.",
        "The tell in the statement is almost always the words **minimum**, **maximum**, **smallest**, **largest** or **least** applied to a number that is not an element of the input, together with a condition you could check easily if only somebody handed you a candidate.",
      ],
    },
  ],
  takeaways: [
    "Search the range of possible answers, not the input",
    "The technique needs a monotone `feasible(x)` — prove it before writing the loop",
    "Feasibility laid out in order must read F…F T…T, and you want the boundary",
    "Derive `lo` and `hi` by argument; a generous `hi` costs one iteration",
    "The loop is `lower_bound` with a predicate; return `lo` after it closes",
    "Cost is O(n log(range)), and the range is over values, not elements",
    "\"Minimise the maximum\" and \"maximise the minimum\" are the two directions",
  ],
  status: "available",
};
