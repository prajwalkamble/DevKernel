import type { Lesson } from "@/content/types";

export const callStackLesson: Lesson = {
  id: "dsa-fn-call-stack",
  slug: "the-call-stack",
  moduleSlug: "functions-and-the-call-stack",
  title: "The Call Stack",
  summary:
    "What happens in memory when one function calls another, why each level gets its own copy of everything, and how to read a stack trace as the story it is.",
  estimatedMinutes: 25,
  status: "available",
  objectives: [
    "Describe what a stack frame contains and when it is created and destroyed",
    "Explain why each recursive call has its own locals",
    "Read a stack trace as a sequence of calls",
    "State what stack space a recursion costs, and why it counts as memory",
  ],
  sections: [
    {
      id: "frames",
      heading: "A frame per call",
      body: [
        "When a function is called, the machine sets aside a region of memory called a **stack frame**. It holds that call's parameters, its local variables, and the address to return to when it finishes.",
        "When the function returns, its frame is discarded and execution resumes at the saved address. The frames form a stack — last in, first out — which is where the name comes from and why the data structure and the memory region share it.",
        "The important consequence: **every call gets its own frame, so every call gets its own copy of the locals.** Two calls to the same function, even one from inside the other, do not share variables. That is what makes recursion possible at all.",
      ],
      examples: [
        {
          id: "frames-visible",
          title: "Each level has its own `n`",
          lang: "python",
          code: `def countdown(n, depth=0):
    indent = "  " * depth
    print(f"{indent}enter countdown(n={n})")

    if n == 0:
        print(f"{indent}base case, returning")
        return "done"

    result = countdown(n - 1, depth + 1)

    print(f"{indent}back in countdown(n={n}), my n is still {n}")
    return result


print(countdown(3))`,
          output: `enter countdown(n=3)
  enter countdown(n=2)
    enter countdown(n=1)
      enter countdown(n=0)
      base case, returning
    back in countdown(n=1), my n is still 1
  back in countdown(n=2), my n is still 2
back in countdown(n=3), my n is still 3
done`,
          explanation:
            "Four frames existed simultaneously, each with its own `n`. When the innermost returned, execution resumed in the frame below it and found `n` exactly as it had left it — the deeper calls could not touch it. The indentation is the stack depth made visible, and reading it top to bottom then bottom to top is literally reading the stack growing and unwinding.",
        },
      ],
    },
    {
      id: "the-order",
      heading: "The work after the call",
      body: [
        "The example above prints something *after* the recursive call returns. That is worth dwelling on, because it is where most recursion confusion lives.",
        "A function call is not a jump. The caller is **suspended**, with everything it had intact, and resumes at exactly the next instruction when the callee returns. Code before the call runs on the way down; code after it runs on the way back up.",
        "That gives every recursion two phases, and many algorithms use both: building state on the way down, and combining results on the way up. Tree traversals are the clearest example, and this is the mental model the trees module assumes.",
      ],
      examples: [
        {
          id: "down-and-up",
          title: "Both phases, on one recursion",
          lang: "python",
          code: `def visit(n):
    print("down:", n)
    if n == 1:
        print("bottom")
        return 1
    total = n + visit(n - 1)
    print("up  :", n, "total so far", total)
    return total


print("answer:", visit(4))`,
          output: `down: 4
down: 3
down: 2
down: 1
bottom
up  : 2 total so far 3
up  : 3 total so far 6
up  : 4 total so far 10
answer: 10
`,
          explanation:
            "The `down` lines run in order 4, 3, 2, 1 as the stack grows; the `up` lines run 2, 3, 4 as it unwinds. Notice the sum is accumulated on the way *up* — each level adds its own `n` to whatever the level below returned. Nothing is shared and no global is needed, because each frame keeps its own `n` while waiting.",
        },
      ],
    },
    {
      id: "reading-traces",
      heading: "Reading a stack trace",
      body: [
        "When something throws, the runtime prints the stack as it stood at that moment. That is not noise — it is the exact sequence of calls that led to the failure.",
        "**Python prints oldest first**, so the failing call is at the bottom and the entry point at the top. Read from the bottom up.",
        "**Java prints newest first**, so the failing call is the top line. Read from the top down.",
        "Either way the useful line is the deepest one *in code you wrote*. Frames from the standard library above or below it are usually just the messenger.",
      ],
      examples: [
        {
          id: "trace",
          title: "A trace through three levels",
          lang: "python",
          code: `def level_three(values):
    return values[10]


def level_two(values):
    return level_three(values)


def level_one(values):
    return level_two(values)


print(level_one([1, 2, 3]))`,
          output: `Traceback (most recent call last):
  File "main.py", line 13, in <module>
    print(level_one([1, 2, 3]))
          ~~~~~~~~~^^^^^^^^^^^
  File "main.py", line 10, in level_one
    return level_two(values)
  File "main.py", line 6, in level_two
    return level_three(values)
  File "main.py", line 2, in level_three
    return values[10]
           ~~~~~~^^^^
IndexError: list index out of range`,
          explanation:
            "Four frames, printed oldest first. The error is on line 2 in `level_three` — but the *cause* is that line 13 passed a three-element list to something that indexes position 10, and only the full trace shows that. Reading just the last line tells you what broke; reading the whole trace tells you why.",
        },
      ],
    },
    {
      id: "stack-space",
      heading: "Stack depth is memory",
      body: [
        "Frames occupy real memory, and the stack has a fixed size — typically around 1 MB, which is far smaller than the heap.",
        "So **a recursion's depth is a space cost**, and it belongs in your complexity analysis. A recursion that goes n levels deep uses O(n) space even if it allocates nothing, which is why the complexity of a recursive solution is often quoted as \"O(n) time, O(n) space for the call stack\".",
        "Two practical consequences. A recursion over a balanced tree of a million nodes is about 20 levels deep and completely safe. A recursion over a *linked list* of a million nodes is a million levels deep and will exhaust the stack — which is why linked-list problems are usually solved iteratively.",
        "The limits: Java's default stack allows roughly 10,000 to 20,000 frames. Python's is set explicitly at 1,000 and raises `RecursionError` rather than crashing.",
      ],
      examples: [
        {
          id: "depth-cost",
          title: "How deep each shape goes",
          lang: "python",
          code: `import sys

print("Python's limit:", sys.getrecursionlimit())


def depth(n):
    return 0 if n == 0 else 1 + depth(n - 1)


print("900 deep is fine:", depth(900))

try:
    depth(5000)
except RecursionError:
    print("5000 deep: RecursionError")

# A balanced tree of n nodes is only log2(n) deep.
for n in (1000, 1_000_000, 1_000_000_000):
    levels = n.bit_length()
    print(f"balanced tree of {n:>13,} nodes: about {levels:>2} levels deep")`,
          output: `Python's limit: 1000
900 deep is fine: 900
5000 deep: RecursionError
balanced tree of         1,000 nodes: about 10 levels deep
balanced tree of     1,000,000 nodes: about 20 levels deep
balanced tree of 1,000,000,000 nodes: about 30 levels deep
`,
          explanation:
            "The last block is the reassuring half: a *balanced* structure is logarithmically deep, so a billion nodes is thirty frames and recursion is entirely safe. The danger is a structure that degenerates into a chain — an unbalanced tree, or a linked list — where depth equals length. When deciding whether recursion is safe, the question is not how many items there are but how deep the recursion goes.",
        },
      ],
      pitfalls: [
        {
          title: "Forgetting stack space in a complexity answer",
          body: "Saying a recursive tree traversal is \"O(n) time, O(1) space\" is wrong — it uses O(h) space for the call stack, where h is the height. Interviewers ask about this specifically, and the correct answer is O(h), which is O(log n) for a balanced tree and O(n) for a degenerate one.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is a stack frame?",
      answer:
        "The region of memory allocated for one function call, holding its parameters, its local variables and the return address. It is created when the function is called and discarded when it returns, and frames form a last-in-first-out stack. The key consequence is that every call — including every level of a recursion — gets its own copy of the locals, which is what allows a function to call itself without the levels interfering.",
    },
    {
      question: "What is the space complexity of a recursive tree traversal?",
      answer:
        "O(h), where h is the height of the tree, because that many frames exist simultaneously at the deepest point. For a balanced tree that is O(log n); for a degenerate tree that has become a chain it is O(n). Answering \"O(1) because it allocates nothing\" is a common mistake — the call stack is real memory and belongs in the analysis, and interviewers ask about it deliberately.",
    },
    {
      question: "How do you read a stack trace?",
      answer:
        "Python prints frames oldest first, so the failure is at the bottom and you read upwards; Java prints newest first, so the failure is the top line and you read down. Either way the most useful frame is the deepest one in code you wrote — library frames above or below it are usually just relaying. The last line names what went wrong, and the surrounding frames explain how execution got there, which is often where the real cause is.",
    },
  ],
  takeaways: [
    "A call allocates a frame holding parameters, locals and the return address",
    "Frames are last-in-first-out, which is why the region and the data structure share a name",
    "Every call has its own locals, which is what makes recursion possible",
    "Code before a call runs on the way down; code after it runs on the way back up",
    "Python prints traces oldest-first, Java newest-first; the useful frame is the deepest one you wrote",
    "Recursion depth is space: O(h) for a tree, and it belongs in your complexity answer",
    "A balanced structure is logarithmically deep — a billion nodes is about 30 frames",
    "A degenerate chain is as deep as it is long, which is why linked lists are done iteratively",
  ],
};
