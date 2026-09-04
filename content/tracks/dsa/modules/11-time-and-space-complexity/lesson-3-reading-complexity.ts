import type { Lesson } from "@/content/types";

export const readingComplexityLesson: Lesson = {
  id: "dsa-cx-reading",
  slug: "reading-complexity-off-code",
  moduleSlug: "time-and-space-complexity",
  title: "Reading Complexity Off Code",
  summary:
    "Sequential loops add, nested loops multiply, halving gives a log — and the library calls that hide a whole loop inside one line.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Read the complexity of a loop structure by inspection",
    "Apply the addition and multiplication rules correctly",
    "Recognise where a halving loop gives a logarithm",
    "Find the hidden linear operations inside innocent-looking lines",
  ],
  sections: [
    {
      id: "the-rules",
      heading: "Three rules",
      body: [
        "**Sequential code adds.** Two loops one after the other are O(n) + O(n) = O(2n) = **O(n)**. Doing a linear thing twice is still linear.",
        "**Nested code multiplies.** A loop inside a loop is O(n) × O(n) = **O(n²)**. Ask how many times the *inner body* runs in total.",
        "**Halving gives a logarithm.** A loop where the range halves each iteration runs about log₂ n times, because that is how many halvings it takes to reach 1.",
        "Almost every complexity you will ever read off code is a combination of those three. The remaining difficulty is not the rules — it is spotting the loops that do not look like loops.",
      ],
      examples: [
        {
          id: "add-vs-multiply",
          title: "Adding against multiplying, counted",
          lang: "python",
          code: `def two_passes(values):
    ops = 0
    for _ in values:
        ops += 1
    for _ in values:
        ops += 1
    return ops


def nested(values):
    ops = 0
    for _ in values:
        for _ in values:
            ops += 1
    return ops


def triangular(values):
    ops = 0
    for i in range(len(values)):
        for _ in range(i + 1, len(values)):
            ops += 1
    return ops


print(f"{'n':>6}  {'two passes':>11}  {'nested':>10}  {'triangular':>11}")
for n in (10, 100, 1000):
    data = list(range(n))
    print(f"{n:>6}  {two_passes(data):>11,}  {nested(data):>10,}  {triangular(data):>11,}")

print()
print("two passes is O(n): sequential loops ADD")
print("nested and triangular are both O(n^2): nested loops MULTIPLY")
print("triangular is half of nested -- same class, constant factor apart")`,
          output: `     n   two passes      nested   triangular
    10           20         100           45
   100          200      10,000        4,950
  1000        2,000   1,000,000      499,500

two passes is O(n): sequential loops ADD
nested and triangular are both O(n^2): nested loops MULTIPLY
triangular is half of nested -- same class, constant factor apart`,
          explanation:
            "The triangular loop — `for j in range(i + 1, n)` — is the one people misread. It runs n(n−1)/2 times, which is half of the full nesting and **still O(n²)**. Every all-pairs problem has this shape, and the instinct that \"it does less work so it must be better\" is wrong at the level of complexity classes even though it is right at the level of the stopwatch.",
        },
      ],
      pitfalls: [
        {
          title: "Assuming a nested loop is always quadratic",
          body: "It is quadratic only if the inner loop's length grows with n. `for i in range(n): for j in range(10):` is O(10n) = O(n), because the inner bound is a constant. The rule is not \"count the nesting depth\" — it is \"count how many times the innermost body runs in total\".",
        },
      ],
    },
    {
      id: "logarithms",
      heading: "Where logarithms come from",
      body: [
        "A logarithm appears whenever the problem size is **divided by a constant factor** each step rather than reduced by a constant amount.",
        "`while n > 1: n //= 2` runs log₂ n times, because halving 1024 eleven times reaches 1. That is the entire source of every log in this course.",
        "Three places it shows up: **binary search**, which halves the search range; **balanced tree operations**, where the height of a tree over n nodes is log n; and **divide-and-conquer recursion**, where the recursion depth is log n and each level does O(n) work, giving the O(n log n) of merge sort.",
        "**The base is never written**, because changing base multiplies by a constant — log₂ n = log₁₀ n / log₁₀ 2 — and constants are dropped. Everyone means base 2 and nobody writes it.",
      ],
      examples: [
        {
          id: "logs",
          title: "Counting the halvings",
          lang: "python",
          code: `def binary_search_steps(values, target):
    lo, hi, steps = 0, len(values) - 1, 0
    while lo <= hi:
        steps += 1
        mid = lo + (hi - lo) // 2
        if values[mid] == target:
            return steps
        if values[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return steps


for n in (16, 1024, 1_048_576):
    data = list(range(n))
    print(f"n = {n:>9,}  binary search steps = {binary_search_steps(data, n - 1):>3}"
          f"  (log2 n = {n.bit_length() - 1})")

print()
print("halving:", end=" ")
n = 1024
while n > 1:
    print(n, end=" ")
    n //= 2
print(1)
print("that is 11 values, and log2(1024) + 1 = 11")`,
          output: `n =        16  binary search steps =   5  (log2 n = 4)
n =     1,024  binary search steps =  11  (log2 n = 10)
n = 1,048,576  binary search steps =  21  (log2 n = 20)

halving: 1024 512 256 128 64 32 16 8 4 2 1
that is 11 values, and log2(1024) + 1 = 11
`,
          explanation:
            "A million elements in twenty-one steps. The +1 over log₂ n is the last iteration on a single-element range, and it is exactly the kind of constant the notation discards. The printed halving sequence is worth staring at once: **that short list is the whole reason logarithmic algorithms feel like cheating.**",
        },
      ],
    },
    {
      id: "hidden",
      heading: "The loops that do not look like loops",
      body: [
        "This is where most misreadings happen: a line that costs O(n) sitting inside a loop that runs n times.",
        "**`x in list` is O(n)** — it scans. `x in set` and `x in dict` are O(1). Confusing them is the single most common cause of a solution that is accidentally quadratic.",
        "**Slicing copies.** `values[i:]` allocates and copies, so it is O(n − i), not free.",
        "**String concatenation rebuilds.** `s += x` copies the whole string, as the arrays module established.",
        "**`list.insert(0, x)` and `pop(0)` shift** — O(n).",
        "**`min`, `max`, `sum`, `sorted`, `count`, `index`** all traverse: O(n), or O(n log n) for `sorted`.",
        "**In Java:** `list.contains` is O(n), `list.remove(Object)` is O(n), `String.substring` copies, and `list.get(i)` on a `LinkedList` is O(i) even though the syntax is identical to an `ArrayList`'s O(1).",
      ],
      examples: [
        {
          id: "hidden-cost",
          title: "One character's difference, ninety times the work",
          lang: "python",
          code: `def looks_linear(values, targets):
    """The \`in\` is O(n), so this is O(n * m), not O(m)."""
    ops = 0
    found = 0
    for t in targets:
        for v in values:          # what \`t in values\` really does
            ops += 1
            if v == t:
                found += 1
                break
    return found, ops


def actually_linear(values, targets):
    lookup = set(values)          # O(n) once
    ops = len(values)
    found = 0
    for t in targets:
        ops += 1                  # O(1) each
        if t in lookup:
            found += 1
    return found, ops


values = list(range(1000))
targets = [999] * 100

a = looks_linear(values, targets)
b = actually_linear(values, targets)
print("list membership:", a[0], "found,", f"{a[1]:,}", "operations")
print("set membership :", b[0], "found,", f"{b[1]:,}", "operations")
print("ratio:", f"{a[1] / b[1]:.1f}x")`,
          output: `list membership: 100 found, 100,000 operations
set membership : 100 found, 1,100 operations
ratio: 90.9x`,
          explanation:
            "Same answer, ninety times the work, and the difference in source code is `list` against `set`. The expanded inner loop in the first function is literally what `t in values` compiles down to — writing it out is the exercise that makes the cost visible. **Whenever you see a membership test inside a loop, check what it is testing against.**",
        },
      ],
      pitfalls: [
        {
          title: "`if x in visited` where `visited` is a list",
          body: "It is the archetypal accidental quadratic. Graph traversals, deduplication and cycle detection all want a `set` here, and the fix is one word. The symptom is a solution that passes small tests and times out on the large one, with no other clue — which is why checking every membership test is worth doing before submitting.",
        },
      ],
    },
    {
      id: "worked",
      heading: "Working through unfamiliar code",
      body: [
        "A procedure that works when the answer is not obvious.",
        "**1. Find the loops**, including the hidden ones inside library calls and recursion.",
        "**2. For each, ask how many times it runs** — n, n/2, log n, a constant.",
        "**3. Multiply for nesting, add for sequence.**",
        "**4. Take the dominant term** and drop constants.",
        "Two rules of thumb save time. Look at the innermost statement and ask how many times it executes in total — that is usually the answer directly. And when a loop's bound depends on the outer variable, sum it: 1 + 2 + … + n is n(n+1)/2, which is O(n²).",
        "When multiple inputs are involved, **name them separately**. Two lists of different lengths give O(n × m), not O(n²), and a grid is O(rows × cols). Collapsing them into one letter is a real error, not pedantry — it is wrong whenever the inputs differ in size.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are the rules for reading complexity off code?",
      answer:
        "Sequential blocks add, so two linear passes are still O(n). Nested loops multiply, so a loop inside a loop over the same data is O(n²). A loop that divides the size by a constant factor each step gives a logarithm, since that is how many halvings reach 1. Then take the dominant term and drop constants. The nuance is that nesting depth is not the rule — the question is how many times the innermost body executes in total, so an inner loop with a constant bound keeps the whole thing linear.",
    },
    {
      question: "Why is a triangular nested loop still O(n²)?",
      answer:
        "Because `for i in range(n): for j in range(i+1, n)` executes its body n(n−1)/2 times, and dropping the constant ½ leaves n². It really does half the work of a full nesting — 499,500 iterations against a million at n = 1000 — but a constant factor never changes the class. This is the all-pairs shape, and the instinct that doing less work must mean a better complexity is wrong here.",
    },
    {
      question: "What hidden costs make code accidentally quadratic?",
      answer:
        "Library calls that traverse. `x in list` is O(n) while `x in set` is O(1), and a membership test inside a loop is the classic accidental quadratic — measurably ninety times the work in a small experiment. Slicing copies; string `+=` rebuilds; `insert(0, x)` and `pop(0)` shift; `min`, `max`, `sum` and `count` all traverse. In Java, `list.contains` is O(n) and `LinkedList.get(i)` is O(i) despite looking identical to an `ArrayList` call.",
    },
  ],
  takeaways: [
    "Sequential loops add, nested loops multiply, halving gives a logarithm",
    "Nesting depth is not the rule — count how many times the innermost body runs",
    "A triangular loop runs n(n−1)/2 times and is still O(n²)",
    "A million elements need twenty-one binary search steps",
    "The logarithm's base is never written, because changing it is a constant factor",
    "`x in list` is O(n); `x in set` is O(1) — the archetypal accidental quadratic",
    "Slicing, `+=` on strings, `insert(0, x)`, `sum`, `min` and `sorted` all traverse",
    "Name multiple inputs separately: O(n × m), never O(n²) for two different lists",
  ],
};
