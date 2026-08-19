import type { Lesson } from "@/content/types";

export const pureFunctionsLesson: Lesson = {
  id: "dsa-fn-pure",
  slug: "pure-functions-and-side-effects",
  moduleSlug: "functions-and-the-call-stack",
  title: "Pure Functions & Side Effects",
  summary:
    "The distinction that decides whether a function can be tested, memoised, or trusted inside a recursion — and why it pays off two modules from here.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Define a pure function and identify impurities in a given one",
    "Explain why only pure functions can be safely memoised",
    "Refactor an impure function into a pure core plus a thin impure shell",
    "Say which side effects are legitimate and where they belong",
  ],
  sections: [
    {
      id: "definition",
      heading: "Two conditions",
      body: [
        "A function is **pure** when both of these hold:",
        "**Same input, same output — always.** It does not consult a global, a clock, a random number, or anything else that could change between calls.",
        "**No side effects.** It does not modify anything outside itself: no writing to globals, no mutating its arguments, no printing, no file or network access.",
        "The consequence worth caring about: a pure function's *call* can be replaced by its *result* without changing the program. That property is what makes it testable, cacheable and safe to call from anywhere.",
      ],
      examples: [
        {
          id: "pure-vs-impure",
          title: "Four functions, one of them pure",
          lang: "python",
          code: `total = 0


def pure(values):
    return sum(v for v in values if v % 2 == 0)


def impure_reads_global(values):
    return sum(values) + total


def impure_mutates_argument(values):
    values.sort()
    return values[0]


def impure_prints(values):
    print("working on", len(values), "values")
    return sum(values)


data = [3, 1, 4]
print("pure twice   :", pure(data), pure(data))
print("data after   :", data)

impure_mutates_argument(data)
print("after impure :", data)

global_before = pure(data)
total = 100
print("pure again   :", pure(data), "unchanged:", pure(data) == global_before)
print("impure again :", impure_reads_global([1, 2]))`,
          output: `pure twice   : 4 4
data after   : [3, 1, 4]
after impure : [1, 3, 4]
pure again   : 4 unchanged: True
impure again : 103`,
          explanation:
            "`pure` gives the same answer both times, leaves `data` alone, and is unaffected by the global changing underneath it. The other three each break one condition: reading a global makes the result depend on invisible state, sorting the argument changes the caller's data, and printing is a side effect even though the return value is fine.",
        },
      ],
    },
    {
      id: "why-it-matters",
      heading: "Three places this pays off",
      body: [
        "**Testing.** A pure function is tested with one line: call it, compare the result. An impure one needs its world set up first — globals initialised, output captured, arguments restored between tests.",
        "**Memoisation.** Caching a function's result is only valid if the result depends solely on the arguments. Memoising an impure function returns a stale answer from a different context, silently. This is the direct link to dynamic programming, where memoisation is the entire technique.",
        "**Recursion.** A recursive call has to be trustworthy: you assume it returns the right answer for a smaller input and build on it. If the function also mutates shared state, one branch's work corrupts another's, which is the backtracking bug from the scope lesson.",
        "So purity is not a stylistic preference imported from functional programming. It is the precondition for two techniques this track depends on.",
      ],
      examples: [
        {
          id: "memoisation",
          title: "Why memoising an impure function is wrong",
          lang: "python",
          code: `from functools import lru_cache

offset = 0


@lru_cache(maxsize=None)
def impure(n):
    return n + offset


@lru_cache(maxsize=None)
def pure(n):
    return n * 2


print("impure(5) with offset 0:", impure(5))
offset = 100
print("impure(5) with offset 100:", impure(5), "<- stale, should be 105")
print("impure(6) with offset 100:", impure(6), "<- correct, never cached before")

print("pure(5) twice:", pure(5), pure(5))`,
          output: `impure(5) with offset 0: 5
impure(5) with offset 100: 5 <- stale, should be 105
impure(6) with offset 100: 106 <- correct, never cached before
pure(5) twice: 10 10`,
          explanation:
            "The cache returns 5 for `impure(5)` long after the correct answer became 105, because the cache key is the argument and the argument did not change — the *world* did. And note how confusing the symptom is: `impure(6)` is correct because it was never cached, so the function appears to work for new inputs and lie about old ones. Memoisation is only sound on pure functions, which is why DP solutions must take all their state through parameters.",
        },
      ],
    },
    {
      id: "refactoring",
      heading: "A pure core with a thin impure shell",
      body: [
        "Programs cannot be entirely pure — something has to read input and print answers. The useful discipline is not to eliminate side effects but to **concentrate** them.",
        "Push the input and output to the edges and keep the computation pure in the middle. Then the interesting part is testable, and the untestable part is a few lines with no logic in it.",
        "This is exactly the shape the practice console expects: a pure function that takes arguments and returns a value, with the harness supplying the input and comparing the output.",
      ],
      examples: [
        {
          id: "core-and-shell",
          title: "Separating the computation from the reporting",
          lang: "python",
          code: `def mixed(values):
    print("Starting analysis...")
    values.sort()
    middle = values[len(values) // 2]
    print(f"The median is {middle}")


def median(values):
    """Pure: no printing, no mutation, same answer every time."""
    ordered = sorted(values)
    return ordered[len(ordered) // 2]


def report(values):
    """Impure shell: three lines, no logic."""
    print("Starting analysis...")
    print(f"The median is {median(values)}")


data = [5, 1, 4]
report(data)
print("caller's data untouched:", data)

# The pure core is testable in one line each.
print(median([5, 1, 4]) == 4)
print(median([1]) == 1)
print(median([2, 1]) == 2)`,
          output: `Starting analysis...
The median is 4
caller's data untouched: [5, 1, 4]
True
True
True`,
          explanation:
            "`median` is now three lines with no side effects, and the three assertions test it completely. `report` still prints and is still impure — but it contains no logic, so there is nothing in it to get wrong. Testing `mixed` would have required capturing stdout and restoring the mutated list between cases.",
        },
      ],
    },
    {
      id: "legitimate",
      heading: "Side effects that are fine",
      body: [
        "Not every side effect is a problem, and treating purity as an absolute produces contorted code. Three cases are entirely legitimate.",
        "**Mutating a local you created.** Building a list inside a function and returning it is pure from the outside — nothing the caller can observe was changed.",
        "**Mutating an argument when that is the documented job.** `Collections.sort(list)` exists to sort the list. The rule is that it must be obvious from the name, and a function should not do it as a side effect of computing something else.",
        "**Printing at the edges.** In `main`, in a test, in a report function. The problem is printing from a function whose job is computation.",
        "The practical test: **can a caller be surprised?** Building a local list surprises nobody. A function called `median` that reorders your data does.",
      ],
      examples: [
        {
          id: "local-mutation",
          title: "Mutation that is invisible from outside",
          lang: "python",
          code: `def evens_doubled(values):
    """Mutates a local list heavily, and is pure from the caller's view."""
    result = []
    for v in values:
        if v % 2 == 0:
            result.append(v * 2)
    result.sort(reverse=True)
    return result


data = [3, 4, 1, 6]
first = evens_doubled(data)
second = evens_doubled(data)

print("result:", first)
print("same answer twice:", first == second)
print("caller's data unchanged:", data)`,
          output: `result: [12, 8]
same answer twice: True
caller's data unchanged: [3, 4, 1, 6]`,
          explanation:
            "There is an `append` and a `sort` in there, and the function is still pure by the definition that matters: same input gives same output, and nothing the caller can see was modified. Purity is about observable behaviour at the boundary, not about avoiding assignment.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a pure function?",
      answer:
        "One that returns the same output for the same input every time, and has no side effects — it does not read mutable external state, modify its arguments, print, or touch the outside world. The defining property is that a call can be replaced by its result without changing the program's behaviour, which is what makes such functions testable in one line, safe to cache, and safe to call from a recursion.",
    },
    {
      question: "Why can you only memoise a pure function?",
      answer:
        "Because memoisation keys the cache on the arguments, so it is only valid if the arguments fully determine the result. An impure function whose answer also depends on a global or a clock will return a stale cached value after that state changes, and the symptom is confusing — previously-seen inputs lie while new ones are correct. It matters directly for dynamic programming, where memoisation is the whole technique and every piece of state must therefore travel through the parameters.",
    },
    {
      question: "Is a function that mutates a local list impure?",
      answer:
        "No. Purity is about what a caller can observe at the boundary, not about avoiding assignment. Building a list inside a function, appending to it and sorting it is invisible from outside, so the function is pure as long as the same input still produces the same output and nothing the caller owns was touched. The practical test is whether a caller can be surprised — a local buffer surprises nobody, while a `median` function that reorders your list does.",
    },
  ],
  takeaways: [
    "Pure means same input gives same output, and no observable side effects",
    "A pure call can be replaced by its result without changing the program",
    "Testing a pure function is one line; testing an impure one needs its world set up",
    "Memoisation is only sound on pure functions — a cached impure answer goes stale silently",
    "Recursion depends on trusting the recursive call, which shared state breaks",
    "Concentrate side effects at the edges: a pure core with a thin impure shell",
    "That shape is exactly what the practice console and every judge expect",
    "Mutating a local is fine; the test is whether a caller can be surprised",
  ],
};
