import type { Lesson } from "@/content/types";

export const spaceComplexityLesson: Lesson = {
  id: "dsa-cx-space",
  slug: "space-complexity",
  moduleSlug: "time-and-space-complexity",
  title: "Space Complexity & the Call Stack",
  summary:
    "What counts as extra space, why recursion costs memory even when it allocates nothing, and how to trade one resource for the other deliberately.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Define auxiliary space and say what is excluded from it",
    "Count the call stack as space and give the depth for common shapes",
    "State the space complexity of the standard algorithms",
    "Make a space-for-time trade knowingly rather than accidentally",
  ],
  sections: [
    {
      id: "auxiliary",
      heading: "Auxiliary space",
      body: [
        "**Space complexity** conventionally means **auxiliary space** — the extra memory an algorithm uses beyond the input itself.",
        "The input is excluded because you had to receive it either way; counting it would make every algorithm O(n) and tell you nothing. So a function that sorts an array in place is **O(1) space** even though it is touching n elements, because it added nothing.",
        "What counts: any array, list, map, set or string you allocate; anything a library call allocates on your behalf; and — the one people forget — **the call stack**.",
        "What does not count: the input, and the output when the problem requires returning something of that size. Returning a list of n results is not usually charged as extra space, though say so explicitly if it matters.",
      ],
      examples: [
        {
          id: "three-versions",
          title: "Three ways to sum, three space costs",
          lang: "python",
          code: `import sys


def sum_iterative(values):
    """O(1) extra space: one accumulator."""
    total = 0
    for v in values:
        total += v
    return total


def sum_recursive(values, i=0):
    """O(n) space: one stack frame per element."""
    if i == len(values):
        return 0
    return values[i] + sum_recursive(values, i + 1)


def sum_copying(values):
    """O(n) space: a new list."""
    doubled = [v * 2 for v in values]
    return sum(doubled) // 2


data = list(range(1000))
print("all three agree:", sum_iterative(data) == sum_copying(data))
print("iterative extra space: O(1)")
print("copying extra space  : O(n) -- the new list holds", len(data), "items")

sys.setrecursionlimit(3000)
print("recursive on 1000   :", sum_recursive(data))
try:
    sum_recursive(list(range(100000)))
except RecursionError as e:
    print("recursive on 100000 :", type(e).__name__)`,
          output: `all three agree: True
iterative extra space: O(1)
copying extra space  : O(n) -- the new list holds 1000 items
recursive on 1000   : 499500
recursive on 100000 : RecursionError`,
          explanation:
            "Same answer, three different space profiles, and only the recursive one **fails** — a `RecursionError` on a hundred thousand elements, on a function whose only memory is stack frames. That is the point of this lesson: space is not just what you allocate, and the failure mode is a crash rather than slowness.",
        },
      ],
    },
    {
      id: "the-stack",
      heading: "The call stack is space",
      body: [
        "Every function call pushes a frame holding its parameters, locals and return address. The frames live until the calls return, so **the maximum depth of the recursion is a space cost.**",
        "That gives a rule worth memorising: **the space of a recursive algorithm is its maximum depth, not its number of calls.**",
        "A balanced binary recursion of depth d makes 2ᵈ calls and reaches depth d, so it is O(2ᵈ) time and O(d) space. Confusing the two is the standard mistake in this topic.",
        "Practical limits: Python's default recursion limit is 1,000 frames and raises `RecursionError`. Java's default stack allows on the order of 10,000 frames and throws `StackOverflowError`. Both mean the same thing — **a recursion whose depth is O(n) will fail on a large input**, and the fix is an iterative version with an explicit stack.",
      ],
      examples: [
        {
          id: "depth",
          title: "Depth against calls, and the common shapes",
          lang: "python",
          code: `max_depth = 0


def walk(depth=0):
    global max_depth
    max_depth = max(max_depth, depth)
    if depth == 3:
        return 1
    return walk(depth + 1) + walk(depth + 1)


nodes = walk()
print(f"a balanced binary recursion of depth 3 visits {nodes} leaves")
print(f"but the maximum stack depth is only {max_depth}")
print()
print("time is O(2^depth); space is O(depth) -- they are not the same thing")

print()
print("stack depth for common shapes on n items:")
shapes = [
    ("iterative loop", "O(1)"),
    ("linear recursion (linked list, sum)", "O(n)"),
    ("balanced tree traversal", "O(log n)"),
    ("skewed tree traversal", "O(n)"),
    ("merge sort", "O(log n) stack + O(n) buffer"),
    ("quicksort, recursing on the smaller side", "O(log n)"),
]
for name, cost in shapes:
    print(f"  {name:<42} {cost}")`,
          output: `a balanced binary recursion of depth 3 visits 8 leaves
but the maximum stack depth is only 3

time is O(2^depth); space is O(depth) -- they are not the same thing

stack depth for common shapes on n items:
  iterative loop                             O(1)
  linear recursion (linked list, sum)        O(n)
  balanced tree traversal                    O(log n)
  skewed tree traversal                      O(n)
  merge sort                                 O(log n) stack + O(n) buffer
  quicksort, recursing on the smaller side   O(log n)
`,
          explanation:
            "Eight calls, depth three — the frames for the completed branches are gone by the time the later ones run, so only one root-to-leaf path is ever on the stack. The two tree rows are the ones interviewers probe: a balanced tree gives O(log n) depth, a **skewed** one degenerates to O(n) and can overflow, and that is exactly why balanced trees are worth their complexity.",
        },
      ],
      pitfalls: [
        {
          title: "Claiming a recursive traversal is O(1) space",
          body: "It never is. A tree traversal is O(h) where h is the height — O(log n) if balanced, O(n) if not — and a linked-list recursion is O(n). Genuine O(1) traversal needs either an iterative loop or a technique like Morris traversal that temporarily rewires the tree. Saying \"O(h) space for the recursion stack\" unprompted is a strong signal in an interview.",
        },
      ],
    },
    {
      id: "standard-costs",
      heading: "The space costs worth knowing",
      body: [
        "**Sorting.** Merge sort is O(n) — it needs a buffer. Heap sort is O(1). Quicksort is O(log n) for the stack if it recurses on the smaller side. Python's `sorted` (Timsort) is O(n); Java's `Arrays.sort` on primitives is a dual-pivot quicksort at O(log n), and on objects is Timsort at O(n).",
        "**Graph traversal.** BFS is O(width) for the queue, which can be O(n). DFS is O(depth) for the stack, also O(n) in the worst case. Both need O(n) for the visited set regardless.",
        "**Dynamic programming.** Naively O(n) or O(n × m) for the table — and very often reducible, since a recurrence depending only on the previous row needs two rows rather than all of them. That optimisation turns O(n × m) space into O(m) and is a standard follow-up question.",
        "**Hash structures.** O(n), with a constant factor above 1 because of the spare buckets.",
      ],
    },
    {
      id: "the-trade",
      heading: "Trading one for the other",
      body: [
        "Most optimisation in this course is spending space to save time, and it is worth doing consciously.",
        "**Memoisation** — O(n) space to turn an exponential recursion into a linear one. Usually a spectacular trade.",
        "**Hash maps** — O(n) space to turn an O(n²) double loop into one O(n) pass. The Two Sum trade, and nearly always right.",
        "**Precomputed prefix sums** — O(n) space to answer range-sum queries in O(1) instead of O(n). Right when there are many queries.",
        "**And the reverse trade**, which is rarer and does exist: recomputing instead of storing when memory is the binding constraint. In-place algorithms exist for this reason.",
        "The question to ask is not \"which is better\" but **\"which resource is scarce here?\"** In interviews, time almost always is, so spend memory freely and say that you are doing it.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is space complexity, and what counts toward it?",
      answer:
        "It is auxiliary space — memory used beyond the input, which is excluded because you had to receive it either way. It counts every array, map, set or string you allocate, anything a library call allocates for you, and the call stack. So an in-place sort is O(1) space despite touching n elements, and a recursive sum is O(n) space despite allocating nothing at all. The output is usually not charged when the problem requires returning something that large.",
    },
    {
      question: "Why does recursion cost space, and how much?",
      answer:
        "Every call pushes a stack frame holding parameters, locals and a return address, and those frames survive until the call returns. So the cost is the **maximum depth**, not the number of calls — a balanced binary recursion of depth d makes 2ᵈ calls and uses O(d) space. Balanced tree traversal is O(log n), a skewed tree or a linked list is O(n), and at that depth it overflows: Python raises `RecursionError` at 1,000 frames and Java throws `StackOverflowError` at around 10,000.",
    },
    {
      question: "How would you reduce the space of a dynamic-programming solution?",
      answer:
        "If the recurrence only reads the previous row, keep two rows instead of the whole table — that turns O(n × m) into O(m). If it only reads the previous cell, a single variable suffices, which is how Fibonacci drops from O(n) to O(1). The trade is that you lose the ability to reconstruct the actual path or sequence afterwards, only the value, so the reduction is only available when the problem asks for the value alone.",
    },
  ],
  takeaways: [
    "Space complexity means auxiliary space — extra memory beyond the input",
    "An in-place sort is O(1) space even though it touches n elements",
    "The call stack counts: a recursion's space is its maximum depth, not its call count",
    "Balanced tree traversal is O(log n) space; a skewed tree is O(n) and can overflow",
    "Python raises RecursionError near 1,000 frames; Java overflows near 10,000",
    "Merge sort O(n), heap sort O(1), quicksort O(log n) recursing on the smaller side",
    "A DP recurrence reading only the previous row needs two rows, not the whole table",
    "Spend memory to save time in interviews, and say out loud that you are doing it",
  ],
};
