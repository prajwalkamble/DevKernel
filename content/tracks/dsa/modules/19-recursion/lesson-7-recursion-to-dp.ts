import type { Lesson } from "@/content/types";

export const recursionToDpLesson: Lesson = {
  id: "dsa-rec-to-dp",
  slug: "from-recursion-to-memoisation",
  moduleSlug: "recursion-and-backtracking",
  title: "From Recursion to Memoisation",
  summary:
    "The bridge to dynamic programming, and the reason this module comes before it. A correct recursion plus a cache is a correct DP — so the hard part is never the table, it is the recursion you already know how to write.",
  estimatedMinutes: 25,
  objectives: [
    "Spot overlapping subproblems in a recursion tree",
    "Add memoisation without changing the logic",
    "Identify the state that keys the cache",
    "Say why backtracking usually cannot be memoised",
  ],
  sections: [
    {
      id: "the-waste",
      heading: "Overlapping subproblems",
      body: [
        "The first lesson measured it: `fib(30)` makes 2.7 million calls to compute a value reachable in thirty additions. The tree recomputes `fib(10)` thousands of times, because nothing remembers that it was already asked.",
        "That is **overlapping subproblems** — the same subproblem reached by many different paths — and it is one of the two conditions for dynamic programming. The other is *optimal substructure*, which recursion gives you for free by construction.",
      ],
    },
    {
      id: "the-cache",
      heading: "The change is three lines",
      body: [
        "*Look the arguments up in a cache. If present, return the stored answer. Otherwise compute as before, store, and return.*",
        "The logic is untouched. The recursion still says exactly what it said. All that changes is that each distinct subproblem is solved once.",
        "The effect on Fibonacci is from O(2^n) to **O(n)**, because there are only n distinct subproblems and each is now computed once. That is the entire content of top-down DP.",
        "In Python, `@functools.lru_cache(maxsize=None)` or `@functools.cache` does it as a decorator with no other change to the function. In Java it is a `HashMap` or an array checked at the top. Neither is cleverness; both are bookkeeping.",
      ],
      visual: {
        id: "memo-visual",
        kind: "dp",
        algorithm: "fibonacci",
        lockAlgorithm: true,
        title: "Each subproblem solved exactly once",
      },
    },
    {
      id: "the-state",
      heading: "Finding the state",
      body: [
        "The only real design question is **what identifies a subproblem** — the cache key, usually called the *state*.",
        "For `fib` it is `n`. For \"longest common subsequence of two strings\" it is the pair of positions `(i, j)`. For \"can I make change for amount a using coins from index i onwards\" it is `(i, a)`.",
        "Two rules. **The state must capture everything the answer depends on** — if two calls with the same key can legitimately return different answers, the key is incomplete and the cache is a bug. And **the state should be as small as possible**, because the number of distinct states is the memory cost and, multiplied by the work per state, the time cost.",
        "Getting the state right is the skill the DP module drills. Recursion is where you learn to *find* it, because the parameters of your recursive function already are it.",
      ],
      pitfalls: [
        {
          title: "Caching a function that depends on mutable state outside its arguments",
          body: "If the function reads a `path` list or a `visited` set that changes between calls, the arguments no longer identify the subproblem and the cache returns answers from a different context. This is the most common way memoisation produces wrong answers rather than slow ones.",
        },
        {
          title: "Memoising backtracking",
          body: "Backtracking usually *enumerates* answers rather than computing a value, and the enumeration depends on the whole path so far — which is not a small state. Counting variants can often be memoised; listing variants almost never can. If you are appending to an output list, memoisation is probably not available.",
        },
        {
          title: "Unhashable keys",
          body: "A list cannot be a dictionary key in Python. Convert to a tuple, or use indices instead of slices — `(i, j)` rather than `s[i:j]`, which is also O(1) instead of O(n) to build.",
        },
      ],
    },
  ],
  takeaways: [
    "Overlapping subproblems are what memoisation removes",
    "A correct recursion plus a cache is a correct top-down DP",
    "Fibonacci goes from O(2^n) to O(n) with three lines",
    "The state is whatever identifies a subproblem — usually the function's parameters",
    "The state must be complete, and as small as possible",
    "A cache is wrong if the function depends on mutable state outside its arguments",
    "Enumerating backtracking generally cannot be memoised; counting often can",
  ],
  status: "available",
};
