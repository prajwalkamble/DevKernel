import type { Lesson } from "@/content/types";

export const stackOverflowLesson: Lesson = {
  id: "dsa-fn-stack-overflow",
  slug: "stack-overflow",
  moduleSlug: "functions-and-the-call-stack",
  title: "Stack Overflow: Causing One, Reading It, Fixing It",
  summary:
    "The three causes, what the error looks like in each language, and the four fixes in the order you should try them.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Cause a stack overflow deliberately and read the resulting error",
    "Distinguish an infinite recursion from one that is merely too deep",
    "Apply the four fixes in order of preference",
    "Decide before writing whether a recursion is safe for the given constraints",
  ],
  sections: [
    {
      id: "three-causes",
      heading: "Three causes, needing different fixes",
      body: [
        "The error is the same; the cause is not, and treating them alike wastes time.",
        "**No base case.** The recursion never stops. A bug, and the fix is to add one.",
        "**A base case that is never reached.** There is one, and the progress steps over it — the `n == 0` with a step of two, or a recursive call that does not shrink the input. Also a bug.",
        "**Genuinely too deep.** The recursion is correct and the input is large: a 100,000-node linked list recursed one node at a time. Not a bug in the logic, and the fix is structural rather than a correction.",
        "The first two are diagnosed the same way — look at the base case and at the progress. The third is diagnosed by asking whether the depth is proportional to n rather than to log n.",
      ],
      examples: [
        {
          id: "causes",
          title: "All three, caught",
          lang: "python",
          code: `import sys


def no_base_case(n):
    return no_base_case(n - 1)


def unreachable_base(n):
    if n == 0:
        return 0
    return unreachable_base(n - 2)


def correct_but_deep(n):
    return 0 if n == 0 else 1 + correct_but_deep(n - 1)


for name, fn, arg in [
    ("no base case      ", no_base_case, 10),
    ("base case skipped ", unreachable_base, 5),
    ("correct, too deep ", correct_but_deep, 5000),
    ("correct, fine     ", correct_but_deep, 900),
]:
    try:
        print(f"{name}: returned {fn(arg)}")
    except RecursionError:
        print(f"{name}: RecursionError")

print("recursion limit is", sys.getrecursionlimit())`,
          output: `no base case      : RecursionError
base case skipped : RecursionError
correct, too deep : RecursionError
correct, fine     : returned 900
recursion limit is 1000`,
          explanation:
            "Three identical errors from three different problems. `unreachable_base(5)` steps 5, 3, 1, −1, −3 and never equals 0 — writing `if n <= 0` instead would fix it, which is the same lesson as preferring `<` to `!=` in a loop condition. Only the third case is a depth problem rather than a logic error.",
        },
      ],
    },
    {
      id: "the-errors",
      heading: "What the two languages do",
      body: [
        "**Python** counts frames and raises `RecursionError` at a configurable limit, 1,000 by default. It is a normal exception, so it can be caught, and the traceback is truncated rather than printing a thousand identical frames.",
        "**Java** has no counter — it runs until the actual stack memory is exhausted and throws `StackOverflowError`. That is an `Error` rather than an `Exception`, meaning it is not something you are expected to catch. The depth reached depends on the frame size and is typically 10,000 to 20,000 for a simple method.",
        "The practical difference: Python's limit is low, predictable and adjustable; Java's is high, variable and not.",
      ],
      examples: [
        {
          id: "java-overflow",
          title: "Java's version",
          lang: "java",
          code: `public class Main {
    static int depth(int n) {
        return n == 0 ? 0 : 1 + depth(n - 1);
    }

    public static void main(String[] args) {
        System.out.println("10000 deep: " + depth(10000));

        try {
            depth(-1);
        } catch (StackOverflowError e) {
            System.out.println("depth(-1): StackOverflowError");
        }
    }
}`,
          output: `10000 deep: 10000
depth(-1): StackOverflowError`,
          explanation:
            "Ten thousand frames is comfortable in Java where it is ten times Python's whole limit. `depth(-1)` never reaches the `n == 0` base case, counting downwards forever, and exhausts the stack. Catching `StackOverflowError` works here to keep the example tidy; in real code you should not, because the stack is in an unknown state afterwards.",
        },
      ],
    },
    {
      id: "four-fixes",
      heading: "Four fixes, in order",
      body: [
        "**1. Fix the base case or the progress.** If the recursion is not actually correct, nothing else matters. Check that the base case is reachable — `<=` rather than `==` — and that every recursive call strictly shrinks the input.",
        "**2. Convert to iteration.** For a linear recursion this is usually easy and always removes the depth entirely. Any recursion whose recursive call is the last thing it does — *tail recursion* — converts to a loop mechanically.",
        "**3. Use an explicit stack.** For a branching recursion that must not recurse, replace the call stack with a list you manage yourself. More code, no depth limit, and it is how you would iterate a tree over a million nodes.",
        "**4. Raise the limit.** Python's `sys.setrecursionlimit(10000)` and Java's `-Xss` flag. This is last for a reason: it is not available in an interview, is often not available on a judge, and it postpones the problem rather than removing it. It is legitimate when you have measured the depth and know the bound.",
      ],
      examples: [
        {
          id: "fixes",
          title: "Fixes 2 and 3, on the same problem",
          lang: "python",
          code: `def sum_recursive(values, i=0):
    if i == len(values):
        return 0
    return values[i] + sum_recursive(values, i + 1)


def sum_iterative(values):
    total = 0
    for v in values:
        total += v
    return total


def depth_explicit_stack(node):
    """A branching recursion done with a list instead of the call stack."""
    best = 0
    stack = [(node, 1)]
    while stack:
        current, d = stack.pop()
        if current is None:
            continue
        best = max(best, d)
        left, right = current
        stack.append((left, d + 1))
        stack.append((right, d + 1))
    return best


big = list(range(5000))

try:
    sum_recursive(big)
except RecursionError:
    print("recursive over 5000 items: RecursionError")

print("iterative over 5000 items:", sum_iterative(big))

tree = (((None, None), None), (None, None))
print("depth via explicit stack:", depth_explicit_stack(tree))`,
          output: `recursive over 5000 items: RecursionError
iterative over 5000 items: 12497500
depth via explicit stack: 3`,
          explanation:
            "The recursive sum is a linear recursion and converts to a three-line loop with no depth at all — fix 2, and clearly the right one. The tree depth cannot be written as a simple loop because the structure branches, so it gets an explicit stack of `(node, depth)` pairs — fix 3, which is what the call stack was storing for you.",
        },
      ],
    },
    {
      id: "deciding",
      heading: "Deciding before you write",
      body: [
        "The useful question is not \"will this overflow?\" but **\"how deep does this go, in terms of n?\"** — and the constraints answer it.",
        "**Depth proportional to log n** — balanced trees, binary search, merge sort. Always safe: a billion items is about 30 frames.",
        "**Depth proportional to n** — linked lists, unbalanced trees, linear recursions. Safe up to a few thousand in Python and a few tens of thousands in Java. Above that, use iteration.",
        "**Depth proportional to n where n ≤ 10⁵ or more** — the constraints have told you not to recurse. This is why linked-list reversal is taught iteratively and why an in-order traversal of a degenerate tree needs care.",
        "Doing this estimate before writing is the same habit as reading the constraints for a time complexity, applied to space. It takes ten seconds and it decides the shape of your solution.",
      ],
      examples: [
        {
          id: "deciding",
          title: "The estimate, in numbers",
          lang: "python",
          code: `import sys

limit = sys.getrecursionlimit()
print("Python allows about", limit, "frames\\n")

shapes = [
    ("balanced tree",     lambda n: n.bit_length()),
    ("linked list",       lambda n: n),
    ("merge sort",        lambda n: n.bit_length()),
    ("degenerate tree",   lambda n: n),
]

for name, depth_of in shapes:
    for n in (1000, 100_000):
        d = depth_of(n)
        verdict = "safe" if d < limit else "OVERFLOWS"
        print(f"{name:<16} n={n:>7,}  depth {d:>7,}  {verdict}")`,
          output: `Python allows about 1000 frames

balanced tree    n=  1,000  depth      10  safe
balanced tree    n=100,000  depth      17  safe
linked list      n=  1,000  depth   1,000  OVERFLOWS
linked list      n=100,000  depth 100,000  OVERFLOWS
merge sort       n=  1,000  depth      10  safe
merge sort       n=100,000  depth      17  safe
degenerate tree  n=  1,000  depth   1,000  OVERFLOWS
degenerate tree  n=100,000  depth 100,000  OVERFLOWS
`,
          explanation:
            "The logarithmic shapes are safe at any realistic size — 100,000 nodes is 17 frames. The linear ones overflow at exactly the input sizes problems actually specify. That table is the whole decision, and it is why a tree recursion is normally fine and a linked-list recursion normally is not.",
        },
      ],
    },
    {
      id: "module-close",
      heading: "Closing the module",
      body: [
        "Eight lessons on functions, and the thread through them is that **a function is a boundary**. What crosses it is arguments in and a return value out; everything else — globals, mutated parameters, printing — is a leak that makes the function harder to test, unsafe to memoise, and unreliable inside a recursion.",
        "That boundary is also literally a stack frame, which is why the same idea explains both good design and the depth limit.",
        "Next is arrays and strings, where these functions start operating on real data, and where the in-place techniques depend on understanding exactly which changes the caller will see.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What causes a StackOverflowError?",
      answer:
        "Too many stack frames alive at once. Three distinct causes: a missing base case, a base case that is never reached because the progress steps over it, or a correct recursion that is simply too deep for the input — a 100,000-node linked list recursed one node at a time. The first two are logic bugs found by checking the base case and the progress; the third is structural, and the fix is iteration or an explicit stack.",
    },
    {
      question: "How would you fix a recursion that overflows the stack?",
      answer:
        "In order: check the base case is reachable and the recursion actually shrinks its input; convert to iteration if the recursion is linear, which removes the depth entirely; replace the call stack with an explicit stack if the problem branches; and only then raise the limit with `sys.setrecursionlimit` or `-Xss`. Raising the limit is last because it is unavailable in interviews, often unavailable on judges, and postpones rather than removes the problem.",
    },
    {
      question: "How do you decide in advance whether recursion is safe?",
      answer:
        "Ask how the depth relates to n. Logarithmic depth — balanced trees, binary search, merge sort — is safe at any realistic size, since 100,000 items is about 17 frames. Linear depth — linked lists, degenerate trees — is safe to a few thousand in Python and tens of thousands in Java, and overflows at the input sizes problems actually specify. Reading that off the constraints before writing is the space-side counterpart of reading them for a time complexity.",
    },
  ],
  takeaways: [
    "Three causes: no base case, an unreachable base case, or genuinely too deep",
    "`if n <= 0` rather than `if n == 0`, so a step of two cannot skip past it",
    "Python raises a catchable `RecursionError` at a configurable 1,000 frames",
    "Java throws `StackOverflowError` when the memory runs out, typically 10,000–20,000 frames",
    "Fixes in order: correct the recursion, convert to iteration, use an explicit stack, raise the limit",
    "Raising the limit is last — unavailable in interviews and on many judges",
    "Logarithmic depth is always safe; linear depth overflows at realistic input sizes",
    "A function is a boundary: arguments in, return value out, and everything else is a leak",
  ],
};
