import type { Lesson } from "@/content/types";

export const nestedLoopsLesson: Lesson = {
  id: "dsa-flow-nested",
  slug: "nested-loops-and-what-they-cost",
  moduleSlug: "conditional-statements-and-loops",
  title: "Nested Loops & What Each Level Costs",
  summary:
    "Counting the passes rather than guessing, the triangular loop that is still quadratic, and the moment nesting stops being affordable.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Count the total iterations of a nested loop exactly",
    "Explain why a triangular nested loop is still O(n²)",
    "Read the constraints to decide how many levels you can afford",
    "Recognise the nesting that can be replaced by a hash map",
  ],
  sections: [
    {
      id: "counting",
      heading: "Counting the passes",
      body: [
        "Two loops, each running n times, run the inner body n × n times. Three levels give n³. That multiplication is the whole cost model, and it is worth counting rather than eyeballing, because the numbers get large faster than intuition expects.",
        "For n = 1,000: one level is 1,000 passes, two is a million, three is a billion. At roughly 10⁸ simple operations per second, the first is instant, the second is fine, and the third takes about ten seconds — which is a timeout.",
      ],
      examples: [
        {
          id: "counting",
          title: "Counted, not estimated",
          lang: "python",
          code: `def count_square(n):
    passes = 0
    for i in range(n):
        for j in range(n):
            passes += 1
    return passes


def count_triangular(n):
    passes = 0
    for i in range(n):
        for j in range(i + 1, n):
            passes += 1
    return passes


for n in (4, 10, 100):
    square = count_square(n)
    triangular = count_triangular(n)
    print(f"n={n:>4}  full={square:>6}  triangular={triangular:>6}  "
          f"n(n-1)/2={n * (n - 1) // 2:>6}  ratio={square / triangular:.2f}")`,
          output: `n=   4  full=    16  triangular=     6  n(n-1)/2=     6  ratio=2.67
n=  10  full=   100  triangular=    45  n(n-1)/2=    45  ratio=2.22
n= 100  full= 10000  triangular=  4950  n(n-1)/2=  4950  ratio=2.02
`,
          explanation:
            "The triangular loop — the standard shape for \"every pair once\" — does exactly n(n−1)/2 passes, which matches the formula on every row. Note the ratio: it approaches 2, not infinity. Skipping half the pairs halves the work and **does not change the complexity**, because a constant factor of two is invisible to O-notation. A triangular loop is still O(n²) and still times out at the same n.",
        },
      ],
      pitfalls: [
        {
          title: "Believing the inner loop is cheap because it is short",
          body: "An inner loop that runs three times is not nested cost — it is a constant factor. But an inner loop over the same collection *is* nesting, however small the body. What multiplies is the number of passes, not the amount of code in them.",
        },
      ],
    },
    {
      id: "hidden-nesting",
      heading: "Nesting you cannot see",
      body: [
        "The dangerous nested loops are the ones with only one visible loop, where the inner one is hidden inside a library call.",
        "**`x in list`** is a linear scan. Inside a loop over n items, that is O(n²).",
        "**String concatenation in a loop** copies everything so far, as the strings lesson showed — also quadratic.",
        "**`list.remove(x)` or `list.pop(0)`** shift every later element. In a loop, quadratic.",
        "**`values.index(x)`** is another linear scan.",
        "The tell is that the code has one `for` and still behaves quadratically. Whenever a loop is slower than it looks, ask what each *operation* inside it costs — not just how many statements there are.",
      ],
      examples: [
        {
          id: "hidden-nesting",
          title: "One visible loop, quadratic behaviour",
          lang: "python",
          code: `def has_duplicate_list(values):
    seen = []
    steps = 0
    for v in values:
        steps += len(seen)          # what "v in seen" really costs
        if v in seen:
            return True, steps
        seen.append(v)
    return False, steps


def has_duplicate_set(values):
    seen = set()
    steps = 0
    for v in values:
        steps += 1                  # a hash lookup is one step
        if v in seen:
            return True, steps
        seen.add(v)
    return False, steps


for n in (10, 100, 400):
    data = list(range(n))
    _, list_steps = has_duplicate_list(data)
    _, set_steps = has_duplicate_set(data)
    print(f"n={n:>4}  list={list_steps:>6}  set={set_steps:>4}")`,
          output: `n=  10  list=    45  set=  10
n= 100  list=  4950  set= 100
n= 400  list= 79800  set= 400
`,
          explanation:
            "Both functions have exactly one `for` loop. The list version does n(n−1)/2 comparisons because `in` scans; the set version does n, because a hash lookup is constant time. At n = 400 that is 79,800 steps against 400 — a factor of two hundred, from changing one word. This is the single most valuable substitution in the whole track.",
        },
      ],
    },
    {
      id: "affordable",
      heading: "How many levels you can afford",
      body: [
        "The constraints tell you directly. Assuming roughly 10⁸ simple operations per second:",
        "**n ≤ 20** — you can afford exponential, 2ⁿ. Every subset.",
        "**n ≤ 500** — three levels, n³, is about 10⁸. Borderline but usually fine.",
        "**n ≤ 5,000** — two levels, n², is 2.5 × 10⁷. Comfortable.",
        "**n ≤ 100,000** — two levels is 10¹⁰ and will not finish. You need one pass, or one pass plus a sort.",
        "**n ≤ 10⁹** — you cannot even look at every element. The answer is mathematical, or a binary search over the answer.",
        "Reading that off the constraints before writing anything is the single highest-value habit in this track, and it is exactly what the Framework module's fourth step is about.",
      ],
      examples: [
        {
          id: "affordable",
          title: "The same problem at two sizes",
          lang: "python",
          code: `def two_sum_quadratic(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []


def two_sum_linear(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []


small = [2, 7, 11, 15]
print(two_sum_quadratic(small, 9), two_sum_linear(small, 9))

n = 2000
worst = list(range(n))
target = worst[-1] + worst[-2]
print("pairs examined by the quadratic version:", n * (n - 1) // 2)
print("lookups done by the linear version    :", n)
print(two_sum_quadratic(worst, target) == two_sum_linear(worst, target))`,
          output: `[0, 1] [0, 1]
pairs examined by the quadratic version: 1999000
lookups done by the linear version    : 2000
True
`,
          explanation:
            "Same answers, two million operations against two thousand. At n = 2,000 both finish instantly and you would never notice; at the n ≤ 10⁵ the constraints usually specify, the quadratic version does 5 × 10⁹ pair checks and times out. That is why the constraint, not the test you ran, is what tells you whether an approach is viable.",
        },
      ],
    },
    {
      id: "removing",
      heading: "Removing a level",
      body: [
        "Nearly every quadratic-to-linear improvement in this track is one of four moves, and it is worth having the list.",
        "**Replace the inner search with a lookup.** The inner loop asks \"is X here?\" — put the elements in a hash set or map and ask directly. This is Two Sum, and it is the most common one by a distance.",
        "**Sort first.** An inner loop looking for a matching value becomes a two-pointer sweep or a binary search once the data is ordered. Costs O(n log n) and buys a level.",
        "**Precompute a running total.** An inner loop summing a range becomes a subtraction of two prefix sums.",
        "**Keep a window.** An inner loop recomputing something about a contiguous stretch becomes an incremental update as the window slides.",
        "All four have the same shape: the inner loop is *recomputing something it could have remembered*. Spotting that is the skill, and the rest of this track is built on it.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Is a loop that runs `for j = i+1 to n` still O(n²)?",
      answer:
        "Yes. It performs n(n−1)/2 passes, which is half of n², and a constant factor of two does not change the complexity class. It is the right shape for examining every pair exactly once, and it is a genuine halving of real work, but it times out at the same input size as the full double loop. If the constraints rule out n², a triangular loop does not rescue you.",
    },
    {
      question: "How can a function with one loop still be quadratic?",
      answer:
        "When an operation inside it is itself linear. `x in list` scans, `list.pop(0)` shifts every element, string concatenation copies everything accumulated, and `list.index(x)` scans. Each is O(n) inside an O(n) loop. The fix is usually a different structure — a set or dict for membership, a deque for queue behaviour, a list plus `join` for strings — and the habit is to ask what each *operation* costs rather than counting visible loops.",
    },
    {
      question: "The constraints say n ≤ 10⁵. How many nested loops can you afford?",
      answer:
        "One. Two levels is 10¹⁰ operations, far beyond what runs in a second, so the intended solution is O(n) or O(n log n). That points at a single pass with a hash map, or a sort followed by a linear sweep — two pointers, a sliding window, or a greedy. Reading that off the constraint before writing anything narrows the search enormously, which is why it is the fourth step of the framework rather than an afterthought.",
    },
  ],
  takeaways: [
    "Two loops over n multiply: n² passes; three give n³. Count rather than estimate",
    "A triangular loop does n(n−1)/2 passes — half the work, same complexity class",
    "The dangerous nesting is invisible: `in` on a list, `pop(0)`, string `+=`, `index`",
    "Ask what each operation costs, not how many loops you can see",
    "n ≤ 20 exponential, n ≤ 500 cubic, n ≤ 5000 quadratic, n ≤ 10⁵ linear",
    "Swapping a list for a set took 79,800 steps down to 400 at n = 400",
    "Four ways to remove a level: lookup, sort first, prefix sums, sliding window",
    "All four exploit the same thing — the inner loop is recomputing what it could remember",
  ],
};
