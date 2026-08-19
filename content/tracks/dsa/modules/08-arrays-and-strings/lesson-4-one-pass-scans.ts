import type { Lesson } from "@/content/types";

export const onePassScansLesson: Lesson = {
  id: "dsa-arr-scans",
  slug: "one-pass-scans",
  moduleSlug: "arrays-and-strings-hands-on",
  title: "Searching, Summing & Finding the Best in One Pass",
  summary:
    "The loops you will write a thousand times — and the initialisation choice that makes the difference between a correct answer and a plausible wrong one.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Write linear search, sum, min and max from memory",
    "Initialise an accumulator correctly for every legal input",
    "Track the index of the best element as well as its value",
    "Combine several scans into one pass when it is worth doing",
  ],
  sections: [
    {
      id: "linear-search",
      heading: "Linear search",
      body: [
        "Walk the array; return as soon as you find it; return a sentinel if the loop finishes. The sentinel is conventionally −1, because it is not a valid index.",
        "Two things worth getting right. **Return the index, not a boolean**, unless the caller genuinely only needs to know whether it is there — an index answers both questions. And **return early**, because a search that keeps looking after it has found the answer does needless work on every call.",
      ],
      examples: [
        {
          id: "linear-search",
          title: "Search, with the early return",
          lang: "python",
          code: `def index_of(values, target):
    for i, v in enumerate(values):
        if v == target:
            return i
    return -1


def index_of_all(values, target):
    return [i for i, v in enumerate(values) if v == target]


data = [3, 1, 4, 1, 5]
print(index_of(data, 4))
print(index_of(data, 1))
print(index_of(data, 9))
print(index_of_all(data, 1))
print("found:", index_of(data, 4) != -1)`,
          output: `2
1
-1
[1, 3]
found: True`,
          explanation:
            "`index_of` returns the *first* match — 1 appears at indices 1 and 3, and the early return gives 1. When you need all of them, that is a different function, and writing it as a comprehension makes the difference visible at the call site. Note `!= -1` reads better than `>= 0` and means the same thing.",
        },
      ],
      pitfalls: [
        {
          title: "Using 0 as the not-found sentinel",
          body: "0 is a valid index, so returning it for \"not found\" is indistinguishable from finding the element at the front. −1 is the convention precisely because it can never be a valid index. In Python `None` also works and is arguably clearer, but −1 is what interview problems expect.",
        },
      ],
    },
    {
      id: "accumulator-init",
      heading: "The initialisation that decides correctness",
      body: [
        "This is the most important thing in the lesson, and it is one line of code.",
        "**A sum starts at 0.** Correct, because zero is the identity for addition and the sum of nothing is zero.",
        "**A product starts at 1.** Same reasoning, different identity.",
        "**A minimum or maximum must start at the first element**, not at 0 and not at a made-up large number. Starting a maximum at 0 is wrong the instant every value is negative — the bug from the errors lesson.",
        "The rule that covers all of them: **initialise to the identity, or to the first element.** If neither exists — an empty input to a maximum — the function must say so rather than invent an answer.",
      ],
      examples: [
        {
          id: "init",
          title: "Three initialisations, one of them wrong",
          lang: "python",
          code: `def max_from_zero(values):
    best = 0
    for v in values:
        if v > best:
            best = v
    return best


def max_from_first(values):
    if not values:
        return None
    best = values[0]
    for v in values[1:]:
        if v > best:
            best = v
    return best


def max_from_sentinel(values):
    best = float("-inf")
    for v in values:
        best = max(best, v)
    return best if values else None


cases = [[3, 9, 4], [-3, -9, -4], [0], []]
for case in cases:
    a = max_from_zero(case) if case else "n/a"
    b = max_from_first(case)
    c = max_from_sentinel(case)
    print(f"{str(case):<14} from-zero {str(a):>5}   from-first {str(b):>5}   sentinel {str(c):>5}")`,
          output: `[3, 9, 4]      from-zero     9   from-first     9   sentinel     9
[-3, -9, -4]   from-zero     0   from-first    -3   sentinel    -3
[0]            from-zero     0   from-first     0   sentinel     0
[]             from-zero   n/a   from-first  None   sentinel  None
`,
          explanation:
            "The second row is the whole lesson: `from-zero` reports 0, which is not in the list and is not the maximum. Both correct versions give −3. The sentinel approach — starting at negative infinity — also works and is common in Java as `Integer.MIN_VALUE`, but it still needs the empty check, so starting from the first element is usually simpler.",
        },
      ],
      pitfalls: [
        {
          title: "`Integer.MIN_VALUE` as a maximum sentinel",
          body: "It works unless the array legitimately contains `Integer.MIN_VALUE`, in which case you cannot distinguish \"found it\" from \"found nothing\". Rare, and it is exactly the kind of adversarial input a judge includes. Starting from the first element has no such hole.",
        },
      ],
    },
    {
      id: "index-too",
      heading: "Tracking the index as well",
      body: [
        "Problems very often want *where* the best element is, not just what it is. The change is one extra variable, and the thing to get right is updating both together.",
        "The failure mode is updating the value and forgetting the index, or updating them under different conditions — which produces a value and an index that describe different elements.",
        "Keeping them in one `if` body is the defence. If the language offers it, tracking only the index and reading the value through it is better still, because then they cannot disagree.",
      ],
      examples: [
        {
          id: "index-tracking",
          title: "Two variables, or one",
          lang: "python",
          code: `def max_with_index(values):
    if not values:
        return None, -1
    best, best_index = values[0], 0
    for i in range(1, len(values)):
        if values[i] > best:
            best = values[i]
            best_index = i
    return best, best_index


def max_index_only(values):
    if not values:
        return -1
    best_index = 0
    for i in range(1, len(values)):
        if values[i] > values[best_index]:
            best_index = i
    return best_index


data = [3, 9, 4, 9]
value, where = max_with_index(data)
print(f"value {value} at index {where}")

where = max_index_only(data)
print(f"index {where}, which holds {data[where]}")

print("ties go to the first occurrence:", max_index_only([9, 1, 9]))`,
          output: `value 9 at index 1
index 1, which holds 9
ties go to the first occurrence: 0`,
          explanation:
            "The second version keeps one variable, so the value and index can never disagree — a small structural improvement worth preferring. Note the tie behaviour: `>` rather than `>=` means the *first* maximum wins, and swapping the operator would give the last. That choice is a decision the problem statement usually makes for you, and it is worth reading for.",
        },
      ],
    },
    {
      id: "one-pass",
      heading: "Several answers, one pass",
      body: [
        "Computing the minimum, the maximum and the sum with three separate loops works and reads clearly. Doing it in one pass is a constant-factor improvement — three traversals become one — and never changes the complexity.",
        "So it is worth doing when the traversal itself is expensive or the data is huge, and not worth obscuring the code for otherwise. Clarity first.",
        "Where a single pass genuinely matters is when a second pass is **impossible**: a stream you can only read once, or a problem that explicitly asks for one pass. Then the discipline of carrying everything you need in accumulators is the whole technique — and it is the same idea Kadane's algorithm and the sliding window are built on.",
      ],
      examples: [
        {
          id: "one-pass",
          title: "Three passes, then one",
          lang: "python",
          code: `def three_passes(values):
    return min(values), max(values), sum(values)


def one_pass(values):
    if not values:
        return None
    smallest = largest = values[0]
    total = 0
    for v in values:
        if v < smallest:
            smallest = v
        if v > largest:
            largest = v
        total += v
    return smallest, largest, total


data = [3, 1, 4, 1, 5, 9, 2, 6]
print("three passes:", three_passes(data))
print("one pass    :", one_pass(data))
print("agree       :", three_passes(data) == one_pass(data))

# Second-largest needs two accumulators and one pass.
def two_largest(values):
    best = second = float("-inf")
    for v in values:
        if v > best:
            best, second = v, best
        elif v > second and v != best:
            second = v
    return best, second


print("two largest :", two_largest(data))
print("with a tie  :", two_largest([5, 5, 3]))`,
          output: `three passes: (1, 9, 31)
one pass    : (1, 9, 31)
agree       : True
two largest : (9, 6)
with a tie  : (5, 3)
`,
          explanation:
            "`two_largest` is the interesting one: it carries two accumulators and updates them in the right order — assigning `best` before `second` would lose the old best. The `v != best` clause decides whether a repeated maximum counts as the second largest; with `[5, 5, 3]` it gives 3 rather than 5, which is one reading of the question and the statement has to tell you which one it wants.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How would you find the maximum of an array, and what is the classic bug?",
      answer:
        "Initialise to the first element and compare each subsequent one, returning early only if the problem allows it. The classic bug is initialising to 0, which is wrong the moment every value is negative — the function then returns 0, a value not in the array at all, with no error. The rule is to initialise an accumulator to the identity (0 for a sum, 1 for a product) or to the first element for a minimum or maximum, and to handle the empty input explicitly since neither exists there.",
    },
    {
      question: "Why is −1 the conventional not-found return value?",
      answer:
        "Because it can never be a valid index, so it is unambiguous. Returning 0 would be indistinguishable from finding the element at the front, which is a silent wrong answer. Returning a boolean loses information the caller often needs — an index answers both \"is it there?\" and \"where?\". In Python `None` is arguably clearer, but −1 is what interview problems and library methods like `indexOf` use.",
    },
    {
      question: "How do you find the second largest element in one pass?",
      answer:
        "Carry two accumulators, both starting at negative infinity. When a value exceeds the best, shift the old best down to second and take the new best — in that order, since assigning the best first would lose it. When it only exceeds second, update second alone. The subtlety is duplicates: whether a repeated maximum counts as the second largest is a decision the statement must make, and `[5, 5, 3]` gives either 5 or 3 depending on it.",
    },
  ],
  takeaways: [
    "Linear search returns the index, returns early, and uses −1 for not found",
    "A sum starts at 0, a product at 1, and a min or max at the first element",
    "Starting a maximum at 0 is wrong the instant every value is negative",
    "`Integer.MIN_VALUE` as a sentinel fails when the array contains it",
    "An empty input has no maximum — say so rather than inventing one",
    "Track the index alone and read the value through it, so the two cannot disagree",
    "`>` keeps the first of equal maxima; `>=` keeps the last",
    "One pass is a constant-factor win, and is essential only when a second pass is impossible",
  ],
};
