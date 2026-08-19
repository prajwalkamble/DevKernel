import type { Lesson } from "@/content/types";

export const firstRecursionLesson: Lesson = {
  id: "dsa-fn-recursion",
  slug: "your-first-recursion",
  moduleSlug: "functions-and-the-call-stack",
  title: "Your First Recursion",
  summary:
    "The three parts every recursion has, the leap of faith that makes writing one possible, and why the naive Fibonacci is exponential.",
  estimatedMinutes: 30,
  status: "available",
  objectives: [
    "Identify the base case, the recursive case and the progress in any recursion",
    "Write a recursion by trusting the recursive call rather than tracing it",
    "Convert a simple recursion to a loop, and say when that is worth doing",
    "Explain why naive Fibonacci is exponential and what fixes it",
  ],
  sections: [
    {
      id: "three-parts",
      heading: "Three parts, always",
      body: [
        "Every recursion has exactly three parts. If one is missing it does not work, and knowing which is missing tells you what to fix.",
        "**The base case.** An input small enough to answer directly, with no recursive call. Without it the recursion never stops.",
        "**The recursive case.** The answer expressed in terms of the same function applied to a *smaller* input.",
        "**Progress.** Every recursive call must move strictly toward the base case. This is the termination measure from the loops module, in a different costume — and it is the part people forget, producing a recursion that has a base case and never reaches it.",
      ],
      examples: [
        {
          id: "three-parts",
          title: "The three parts labelled",
          lang: "python",
          code: `def factorial(n):
    if n <= 1:            # 1. base case
        return 1
    return n * factorial(n - 1)   # 2. recursive case, 3. progress: n - 1


def sum_list(values, i=0):
    if i == len(values):  # base case: nothing left
        return 0
    return values[i] + sum_list(values, i + 1)   # progress: i + 1


def reverse(text):
    if len(text) <= 1:    # base case: nothing to reverse
        return text
    return reverse(text[1:]) + text[0]           # progress: a shorter string


print(factorial(5))
print(sum_list([1, 2, 3, 4]))
print(reverse("recursion"))`,
          output: `120
10
noisrucer`,
          explanation:
            "Three recursions, three different notions of \"smaller\": a smaller number, a larger index into a fixed list, a shorter string. All three make progress toward their base case on every call, and all three have a base case that requires no recursion. Note `sum_list` uses the defaulted-parameter helper pattern from the overloading lesson.",
        },
      ],
      pitfalls: [
        {
          title: "A base case that is never reached",
          body: "`if n == 0` with a step of `n - 2` from an odd start skips straight past it, exactly like the `!=` loop condition from the infinite-loops lesson. Prefer `if n <= 0` over `if n == 0` for the same reason you prefer `<` over `!=`: it catches the values you stepped over.",
        },
      ],
    },
    {
      id: "leap-of-faith",
      heading: "The leap of faith",
      body: [
        "The reason recursion feels hard is that people try to trace it — following the calls down four levels and back up in their head. That does not scale past about three levels and it is not how anyone writes recursive code.",
        "The technique is to **assume the recursive call already works**, and only ask two questions:",
        "**If `f(smaller)` gives me the correct answer for the smaller input, how do I build the answer for this input from it?** That is the recursive case.",
        "**Which input is small enough that I can answer without asking?** That is the base case.",
        "That is genuinely the whole method. It works because if both answers are right, induction does the rest: the base case is correct, and each level is correct given the one below, so all of them are.",
        "Concretely, for `sum_list`: *assume* the recursion correctly sums everything from position `i + 1` onwards. Then the answer from `i` is that, plus `values[i]`. No tracing required.",
      ],
      examples: [
        {
          id: "leap",
          title: "Written by assumption, not by tracing",
          lang: "python",
          code: `def count_leaves(node):
    # A node is (left, right), or None.
    # ASSUME count_leaves(left) and count_leaves(right) are correct.
    if node is None:
        return 0
    left, right = node
    if left is None and right is None:
        return 1
    return count_leaves(left) + count_leaves(right)


def depth(node):
    # ASSUME depth(child) gives the correct depth of that subtree.
    if node is None:
        return 0
    left, right = node
    return 1 + max(depth(left), depth(right))


tree = (((None, None), None), (None, None))

print("leaves:", count_leaves(tree))
print("depth :", depth(tree))`,
          output: `leaves: 2
depth : 3`,
          explanation:
            "Neither function was written by tracing. `depth` says: my depth is one more than the deeper of my children's — assuming those are right. `count_leaves` says: my leaves are my children's leaves added together, unless I am a leaf myself. Both are two lines of logic, and both would be very hard to arrive at by simulating the calls.",
        },
      ],
    },
    {
      id: "recursion-vs-loop",
      heading: "Recursion against iteration",
      body: [
        "Any recursion can be written as a loop and vice versa. The question is which is *clearer*, and the answer depends on the shape of the problem.",
        "**Use a loop** when the problem is linear — walking a list, counting down, summing. `factorial` as a recursion is a nice teaching example and a worse implementation than the two-line loop: same work, plus n stack frames.",
        "**Use recursion** when the structure branches. Trees, graphs, and any problem where each step produces several sub-problems. Writing a tree traversal iteratively means managing an explicit stack, which is exactly what the recursion was doing for you.",
        "The rule of thumb: **if the problem has one \"next\", write a loop; if it has several, write a recursion.**",
      ],
      examples: [
        {
          id: "both-ways",
          title: "Linear: the loop is better. Branching: the recursion is.",
          lang: "python",
          code: `def factorial_recursive(n):
    return 1 if n <= 1 else n * factorial_recursive(n - 1)


def factorial_iterative(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result


def depth_recursive(node):
    if node is None:
        return 0
    left, right = node
    return 1 + max(depth_recursive(left), depth_recursive(right))


def depth_iterative(node):
    if node is None:
        return 0
    best = 0
    stack = [(node, 1)]
    while stack:
        current, d = stack.pop()
        best = max(best, d)
        left, right = current
        if left is not None:
            stack.append((left, d + 1))
        if right is not None:
            stack.append((right, d + 1))
    return best


tree = (((None, None), None), (None, None))

print(factorial_recursive(5), factorial_iterative(5))
print(depth_recursive(tree), depth_iterative(tree))`,
          output: `120 120
3 3`,
          explanation:
            "For the factorial the loop is three lines and uses no stack; the recursion is showing off. For the depth the recursion is three lines and the iterative version needs an explicit stack of pairs — thirteen lines doing by hand what the call stack was doing for free. That contrast is the whole guidance, and it is why every tree algorithm in Module 1 is written recursively.",
        },
      ],
    },
    {
      id: "exponential-fib",
      heading: "The recursion that is exponential",
      body: [
        "`fib(n) = fib(n-1) + fib(n-2)` is the textbook second example and it is a trap worth understanding, because it introduces the problem dynamic programming exists to solve.",
        "The recursion is correct. It is also **exponential**, because the two branches recompute the same values over and over — `fib(30)` computes `fib(28)` twice, `fib(27)` three times, `fib(26)` five times, and so on.",
        "The fix is memoisation: remember each answer the first time and return it thereafter. That turns exponential into linear, and it is only sound because the function is pure — which is the previous lesson cashing in.",
      ],
      examples: [
        {
          id: "fib-calls",
          title: "Counting the wasted work",
          lang: "python",
          code: `from functools import lru_cache

calls = 0


def fib(n):
    global calls
    calls += 1
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)


for n in (10, 20, 25):
    calls = 0
    value = fib(n)
    print(f"fib({n}) = {value:>5}   calls: {calls:>7}")


@lru_cache(maxsize=None)
def fib_memo(n):
    return n if n <= 1 else fib_memo(n - 1) + fib_memo(n - 2)


print("fib_memo(100) =", fib_memo(100))`,
          output: `fib(10) =    55   calls:     177
fib(20) =  6765   calls:   21891
fib(25) = 75025   calls:  242785
fib_memo(100) = 354224848179261915075`,
          explanation:
            "Look at the growth: from n = 10 to n = 20 the calls go up by a factor of 124, and each further step of 5 multiplies them by roughly 11. That is exponential — the call count is itself about `2 × fib(n)`. Meanwhile the memoised version reaches n = 100 instantly, because each value is computed once. Note that the naive version at n = 100 would need more calls than there are atoms in the observable universe.",
        },
      ],
      pitfalls: [
        {
          title: "Concluding that recursion is slow",
          body: "It is not. The recursion in `depth` and `count_leaves` visits each node once and is perfectly efficient. What is slow is *recomputing the same sub-problem*, which is a property of the problem's shape rather than of recursion — and the cure is memoisation, not iteration.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are the parts of a recursive function?",
      answer:
        "A base case that returns directly without recursing, a recursive case that expresses the answer in terms of the same function on a smaller input, and progress — every call must move strictly toward the base case. Missing the base case gives infinite recursion; having one that is never reached, such as testing `n == 0` while stepping by two from an odd start, is the same failure in a form that looks correct.",
    },
    {
      question: "How do you write a recursive function without tracing it?",
      answer:
        "By assuming the recursive call already works. Ask only two questions: given a correct answer for the smaller input, how do I build the answer for this one — and which input is small enough to answer directly. That gives the recursive case and the base case, and induction guarantees the rest. Tracing four levels of calls in your head does not scale and is not how recursive code is written.",
    },
    {
      question: "Why is naive Fibonacci exponential, and how do you fix it?",
      answer:
        "Because the two branches recompute the same sub-problems repeatedly — `fib(n-1)` and `fib(n-2)` overlap almost entirely, so the call count is roughly proportional to the answer itself, which grows exponentially. Measured, `fib(25)` takes 242,785 calls. Memoising — caching each result the first time it is computed — makes each value computed once and turns it linear. That is only valid because the function is pure, which is why every piece of state in a DP solution has to travel through the parameters.",
    },
  ],
  takeaways: [
    "Three parts: a base case, a recursive case, and progress toward the base case",
    "Prefer `if n <= 0` to `if n == 0`, for the same reason you prefer `<` to `!=`",
    "Write by assuming the recursive call is correct; do not trace it",
    "Two questions: how do I build my answer from the smaller one, and what is small enough to answer directly",
    "One \"next\" means write a loop; several means write a recursion",
    "A tree traversal written iteratively needs an explicit stack — that is what the call stack was doing",
    "Naive Fibonacci is exponential: `fib(25)` costs 242,785 calls",
    "Memoisation makes it linear, and is sound only because the function is pure",
  ],
};
