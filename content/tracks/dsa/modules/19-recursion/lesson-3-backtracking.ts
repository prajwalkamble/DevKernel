import type { Lesson } from "@/content/types";

export const backtrackingLesson: Lesson = {
  id: "dsa-rec-backtracking",
  slug: "choose-explore-un-choose",
  moduleSlug: "recursion-and-backtracking",
  title: "Backtracking: Choose, Explore, Un-choose",
  summary:
    "One template covers subsets, permutations, combinations and every constraint puzzle. Its three lines are always the same, and the third one — the un-choose — is the one people leave out.",
  estimatedMinutes: 35,
  objectives: [
    "Write the backtracking template from memory",
    "Explain what the un-choose restores and why it is required",
    "Say why the result must be appended as a copy",
    "Generate subsets and permutations, and see how they differ",
    "Handle duplicate inputs without a set",
  ],
  sections: [
    {
      id: "the-template",
      heading: "The template",
      body: [
        "*If the current path is a complete answer, record it. Otherwise, for each available choice: **choose** it, **explore** by recursing, then **un-choose** it.*",
        "The un-choose is the whole idea. You are walking a decision tree with a single mutable `path`, and when a branch is exhausted the path must be restored to what it was before that branch started — otherwise the next sibling branch inherits state from the previous one.",
        "That is why it is called backtracking: you go forward, and then you *undo*, deliberately.",
      ],
      examples: [
        {
          id: "backtrack",
          title: "Subsets traced, then permutations and duplicates",
          lang: "python",
          code: `def subsets(nums):
    """choose / explore / un-choose. The un-choose is what makes it correct."""
    out = []
    path = []

    def backtrack(start, depth=0):
        out.append(path[:])                       # a copy — path keeps mutating
        for i in range(start, len(nums)):
            path.append(nums[i])                  # choose
            print(f"{'  ' * depth}chose {nums[i]}, path = {path}")
            backtrack(i + 1, depth + 1)           # explore
            path.pop()                            # un-choose
        return

    backtrack(0)
    return out

print("=== subsets of [1, 2, 3] ===")
result = subsets([1, 2, 3])
print("\\nall subsets:", result)
print("count:", len(result), "= 2^3")

def permutations(nums):
    out = []
    path = []
    used = [False] * len(nums)

    def backtrack():
        if len(path) == len(nums):
            out.append(path[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            path.append(nums[i])
            backtrack()
            path.pop()
            used[i] = False

    backtrack()
    return out

print("\\npermutations of [1,2,3]:", permutations([1, 2, 3]))

def subsets_with_dups(nums):
    """Sort, then skip a value that equals its predecessor at the same depth."""
    nums = sorted(nums)
    out, path = [], []

    def backtrack(start):
        out.append(path[:])
        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i - 1]:
                continue                          # same choice at this level
            path.append(nums[i])
            backtrack(i + 1)
            path.pop()

    backtrack(0)
    return out

print("\\nsubsets of [1,2,2]:", subsets_with_dups([1, 2, 2]))
print("  count:", len(subsets_with_dups([1, 2, 2])), "(not 8 — duplicates removed)")`,
          output: `=== subsets of [1, 2, 3] ===
chose 1, path = [1]
  chose 2, path = [1, 2]
    chose 3, path = [1, 2, 3]
  chose 3, path = [1, 3]
chose 2, path = [2]
  chose 3, path = [2, 3]
chose 3, path = [3]

all subsets: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
count: 8 = 2^3

permutations of [1,2,3]: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]

subsets of [1,2,2]: [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]
  count: 6 (not 8 — duplicates removed)`,
          explanation:
            "Follow the trace's indentation and you are looking at the decision tree directly. After `[1, 2, 3]` completes, the path unwinds to `[1]` and the next sibling gives `[1, 3]` — that unwinding is the `pop()` doing its job.\n\n**Subsets against permutations** differ in exactly one thing: subsets pass `i + 1` as the next `start`, so each element may be used once and order does not matter; permutations loop from 0 with a `used` array, so order does matter and every element appears in every position. That single difference is the whole distinction between the two problem families.",
        },
      ],
    },
    {
      id: "the-copy",
      heading: "Why `path[:]` and not `path`",
      body: [
        "`out.append(path)` appends a **reference**. `path` keeps mutating for the rest of the search, so every entry in `out` ends up pointing at the same list — and at the end they all show whatever `path` finished as, which is usually empty.",
        "`out.append(path[:])` — or `list(path)`, or `new ArrayList<>(path)` in Java — takes a snapshot. This is the same aliasing trap the Go module flagged for `append`, and it is the single most common backtracking bug because the code looks right and the output is uniformly wrong.",
      ],
    },
    {
      id: "duplicates",
      heading: "Duplicates: sort, then skip at the same level",
      body: [
        "With `[1, 2, 2]`, the two 2s are interchangeable, so choosing the first at a given level and choosing the second produce identical subtrees. Exploring both duplicates the output.",
        "The fix is the same shape as 3Sum's: **sort**, then within a level skip any value equal to its predecessor. The condition is `if i > start and nums[i] == nums[i - 1]: continue`.",
        "`i > start` is doing precise work. It means \"this is not the first choice *at this level*\". Using `i > 0` instead would skip the second 2 even when the first was chosen by an *ancestor* rather than a sibling, which wrongly excludes `[2, 2]`. Getting this wrong drops legitimate answers rather than adding extra ones, which is harder to spot.",
      ],
      pitfalls: [
        {
          title: "Forgetting to undo *all* the state",
          body: "The permutation version changes two things per choice — `path` and `used[i]` — so the un-choose must restore both. Any state touched on the way down must be reverted on the way up, and missing one is a bug that appears only on the second branch.",
        },
        {
          title: "`i > 0` instead of `i > start` in the duplicate skip",
          body: "It looks equivalent and is not. `i > start` compares against siblings at the same level; `i > 0` compares against the whole array and silently drops valid answers containing repeated values.",
        },
        {
          title: "Recording the answer in the wrong place",
          body: "For subsets, every node is an answer, so the record happens at the top of the function. For permutations only complete paths count, so it happens behind a length check and is followed by a `return`. Getting this wrong gives partial results in the output.",
        },
      ],
    },
  ],
  takeaways: [
    "Choose, explore, un-choose — and the un-choose is what people omit",
    "Append a *copy* of the path, or every entry aliases the same list",
    "Subsets pass `i + 1`; permutations loop from 0 with a `used` array",
    "Handle duplicates by sorting and skipping with `i > start`, not `i > 0`",
    "Undo every piece of state you touched on the way down",
    "Subsets record at every node; permutations record only at complete paths",
  ],
  status: "available",
};
