import type { Lesson } from "@/content/types";

export const loopInvariantsLesson: Lesson = {
  id: "dsa-flow-invariants",
  slug: "the-loop-invariant",
  moduleSlug: "conditional-statements-and-loops",
  title: "The Loop Invariant",
  summary:
    "One sentence that turns a loop you hope is right into one you can prove is — and the reason interviewers listen for it.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "State the invariant of a loop in one sentence",
    "Check the three conditions that make an invariant a proof",
    "Use an invariant to find an off-by-one error without running the code",
    "Explain why stating the invariant out loud is worth marks in an interview",
  ],
  sections: [
    {
      id: "what-it-is",
      heading: "What an invariant is",
      body: [
        "A **loop invariant** is a statement about your variables that is true every time the loop condition is about to be tested. Not just at the start — every single pass.",
        "It is the answer to \"what does this loop know so far?\", and it is the difference between a loop you wrote by adjusting indices until the tests passed and one you can defend.",
        "The classic example, for summing an array: *after processing the first `i` elements, `total` holds their sum.* That sentence is short, checkable, and it tells you exactly what must be true when the loop ends.",
      ],
      examples: [
        {
          id: "sum-invariant",
          title: "The invariant, checked on every pass",
          lang: "python",
          code: `values = [4, 8, 15, 16]

total = 0
for i in range(len(values)):
    # INVARIANT here: total == sum of values[0:i]
    assert total == sum(values[:i]), f"broken at i={i}"
    print(f"i={i}  total={total:>3}  sum(values[:{i}])={sum(values[:i]):>3}")
    total += values[i]

assert total == sum(values)
print("final total:", total)`,
          output: `i=0  total=  0  sum(values[:0])=  0
i=1  total=  4  sum(values[:1])=  4
i=2  total= 12  sum(values[:2])= 12
i=3  total= 27  sum(values[:3])= 27
final total: 43`,
          explanation:
            "The `assert` makes the invariant executable, and it holds on every pass including the first, where both sides are 0. That first row matters: an invariant that is not true *before the loop starts* is not an invariant, and this is where most broken ones fail.",
        },
      ],
    },
    {
      id: "three-conditions",
      heading: "The three conditions",
      body: [
        "An invariant becomes a proof when three things hold. They are worth knowing by name because they tell you where to look when a loop is wrong.",
        "**Initialisation.** It is true before the first iteration. If it is not, you have set something up wrongly — a counter starting at 1 that should start at 0, an accumulator starting at 0 that should start at the first element.",
        "**Maintenance.** If it is true before a pass, the body leaves it true after. If not, the body is doing the wrong work, or doing it in the wrong order.",
        "**Termination.** When the loop finally stops, the invariant plus the reason it stopped gives you the result you wanted. If not, your bound is wrong — this is where off-by-one errors live.",
        "That third one is the useful one. You do not check it by running the loop; you check it by asking *what is true when the condition first fails?*",
      ],
      examples: [
        {
          id: "termination",
          title: "Using termination to find an off-by-one",
          lang: "python",
          code: `def largest_broken(values):
    # INVARIANT: biggest is the largest of values[0:i]
    biggest = values[0]
    i = 1
    while i < len(values) - 1:
        if values[i] > biggest:
            biggest = values[i]
        i += 1
    # On exit i == len(values) - 1, so values[len-1] was never examined.
    return biggest


def largest_fixed(values):
    biggest = values[0]
    i = 1
    while i < len(values):
        if values[i] > biggest:
            biggest = values[i]
        i += 1
    return biggest


data = [3, 1, 9]
print("broken:", largest_broken(data))
print("fixed :", largest_fixed(data))`,
          output: `broken: 3
fixed : 9`,
          explanation:
            "The invariant says `biggest` is the largest of `values[0:i]`. Termination asks: when the loop stops, what is `i`? In the broken version it is `len(values) - 1`, so the invariant only tells us about `values[0:len-1]` — the last element was never considered. That reasoning finds the bug without running anything, and it names the fix precisely: the bound must be `len(values)`.",
        },
      ],
    },
    {
      id: "binary-search",
      heading: "The invariant that makes binary search writable",
      body: [
        "Binary search is the algorithm people most often write from memory and most often get wrong, because the details — `<` or `<=`, `mid` or `mid + 1` — are impossible to recall reliably.",
        "They are not impossible to *derive*, and the invariant is what derives them: **if the target is present, it lies within `values[lo..hi]`.**",
        "Every decision falls out of keeping that true. If `values[mid] < target`, then `mid` cannot be the answer and neither can anything below it, so `lo = mid + 1` — the `+ 1` is required, because leaving `mid` in the range would break nothing but would also make no progress. The loop continues while the range is non-empty, which for an inclusive `hi` means `lo <= hi`.",
      ],
      examples: [
        {
          id: "binary-search-invariant",
          title: "The range shrinking, with the invariant printed",
          lang: "python",
          code: `def search(values, target):
    lo, hi = 0, len(values) - 1

    while lo <= hi:
        # INVARIANT: if target is in values, its index is in [lo, hi]
        print(f"  searching [{lo}, {hi}] = {values[lo:hi + 1]}")
        mid = lo + (hi - lo) // 2
        if values[mid] == target:
            return mid
        if values[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1

    # Termination: lo > hi means the range is empty, so target is absent.
    return -1


data = [1, 3, 5, 7, 9, 11]
print("find 9:")
print("result", search(data, 9))
print("find 4:")
print("result", search(data, 4))`,
          output: `find 9:
  searching [0, 5] = [1, 3, 5, 7, 9, 11]
  searching [3, 5] = [7, 9, 11]
result 4
find 4:
  searching [0, 5] = [1, 3, 5, 7, 9, 11]
  searching [0, 1] = [1, 3]
  searching [1, 1] = [3]
result -1`,
          explanation:
            "Watch the printed range: it always contains the target when the target exists, and it strictly shrinks every pass. Those two facts are correctness and termination respectively. The second search ends with `lo > hi` and an empty range, which by the invariant means the value is absent — so returning −1 is justified rather than guessed.",
        },
      ],
    },
    {
      id: "interviews",
      heading: "Why say it out loud",
      body: [
        "Stating the invariant is one of the highest-value things you can say in an interview, for three reasons.",
        "**It proves you did not memorise the loop.** Anyone can reproduce binary search from memory. Someone who says \"my invariant is that the target, if present, is in `[lo, hi]`\" is demonstrably deriving it, and the interviewer stops worrying about whether you would cope with a variant.",
        "**It makes your bugs findable in public.** If you get a bound wrong, an interviewer who has heard your invariant can point at it — \"does that still hold when `lo == hi`?\" — instead of watching you flail. That is a much better conversation.",
        "**It is what senior engineers do.** Loop invariants are how anyone reasons about a non-obvious loop, and using the vocabulary signals that you have written code that needed to be right.",
        "The habit to build: before writing the body of any non-trivial loop, write the invariant as a comment. It costs one line and it decides every bound in the loop below it.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a loop invariant?",
      answer:
        "A statement about the program's variables that is true every time the loop condition is about to be evaluated — before the first pass and after every one. It becomes a proof of correctness through three conditions: initialisation, that it holds before the loop starts; maintenance, that the body preserves it; and termination, that the invariant together with the reason the loop stopped gives the result you wanted. Termination is the one that catches off-by-one errors.",
    },
    {
      question: "What is the invariant of binary search, and what does it decide?",
      answer:
        "That if the target is present, its index lies within the current `[lo, hi]` range. Every detail follows from preserving it: when `values[mid] < target`, `mid` and everything below it are ruled out, so `lo = mid + 1` — and the `+ 1` is what guarantees progress. With an inclusive `hi` the range is non-empty exactly when `lo <= hi`, which is the loop condition. On exit `lo > hi` means an empty range, so the target is absent and returning −1 is justified rather than assumed.",
    },
    {
      question: "How would you find an off-by-one error without running the code?",
      answer:
        "State the invariant, then ask what is true at the moment the loop condition first fails. If the invariant covers `values[0:i]` and termination leaves `i` at `len - 1`, the last element was never examined — the bound is wrong and should be `len`. That reasoning localises the error to the condition rather than the body, which is exactly where off-by-one errors are, and it works on a whiteboard with no debugger.",
    },
  ],
  takeaways: [
    "An invariant is a statement true every time the loop condition is about to be tested",
    "Three conditions make it a proof: initialisation, maintenance, termination",
    "An invariant that is not true before the first pass is not an invariant",
    "Termination — what is true when the condition first fails — is where off-by-one errors are found",
    "Binary search's invariant is that the target, if present, lies in `[lo, hi]`",
    "Every binary-search detail follows from preserving that: `mid + 1`, `mid - 1`, `lo <= hi`",
    "Write the invariant as a comment before writing the loop body; it decides every bound below it",
    "Saying it out loud proves you derived the loop rather than memorised it",
  ],
};
