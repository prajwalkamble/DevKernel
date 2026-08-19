import type { Lesson } from "@/content/types";

export const overloadingLesson: Lesson = {
  id: "dsa-fn-overloading",
  slug: "overloading-and-default-arguments",
  moduleSlug: "functions-and-the-call-stack",
  title: "Overloading, Defaults & Variable Arguments",
  summary:
    "Java's several methods with one name, Python's one method with optional parameters, and the helper signature that recursion problems always end up needing.",
  estimatedMinutes: 20,
  status: "available",
  objectives: [
    "Overload a method in Java and say how the compiler picks one",
    "Use default and keyword arguments in Python",
    "Accept a variable number of arguments in both languages",
    "Write the private-helper-with-extra-parameters pattern that recursion needs",
  ],
  sections: [
    {
      id: "overloading",
      heading: "Java: several methods, one name",
      body: [
        "Java lets several methods share a name as long as their **parameter lists differ** — in number, in types, or in order. The compiler picks one by looking at the arguments at the call site, at compile time.",
        "Note what is *not* part of the signature: the return type. Two methods differing only in what they return will not compile, because a call gives the compiler nothing to choose with.",
      ],
      examples: [
        {
          id: "overloading",
          title: "Three overloads, chosen by argument types",
          lang: "java",
          code: `public class Main {
    static int add(int a, int b) {
        return a + b;
    }

    static double add(double a, double b) {
        return a + b;
    }

    static int add(int a, int b, int c) {
        return a + b + c;
    }

    public static void main(String[] args) {
        System.out.println(add(2, 3));
        System.out.println(add(2.5, 3.5));
        System.out.println(add(1, 2, 3));
        System.out.println(add(2, 3.0));
    }
}`,
          output: `5
6.0
6
5.0`,
          explanation:
            "The last call is the interesting one: `add(2, 3.0)` matches no overload exactly, so the compiler widens the `int` 2 to a `double` and picks the `double` version — printing 5.0 rather than 5. Overload resolution prefers an exact match, then widening, then boxing. When two overloads are equally good the code does not compile, which is better than picking arbitrarily.",
        },
      ],
      pitfalls: [
        {
          title: "Overloads that differ only by `int` and `Integer`",
          body: "`f(int)` and `f(Integer)` both exist and the rules for which is chosen involve boxing preferences that almost nobody remembers. Avoid it: if two overloads take conceptually the same argument, give them different names instead.",
        },
      ],
    },
    {
      id: "python-defaults",
      heading: "Python: one function, optional parameters",
      body: [
        "Python has no overloading — a second `def` with the same name simply replaces the first. Instead it has **default values**, which cover most of the same ground with one function.",
        "Parameters with defaults must come after those without. At the call site, arguments can be given by position or **by keyword**, and keywords can be given in any order — which makes a call with several optional settings readable without remembering their order.",
      ],
      examples: [
        {
          id: "defaults",
          title: "Defaults and keyword arguments",
          lang: "python",
          code: `def search(values, target, start=0, reverse=False):
    order = range(len(values) - 1, start - 1, -1) if reverse else range(start, len(values))
    for i in order:
        if values[i] == target:
            return i
    return -1


data = [1, 2, 3, 2, 1]

print(search(data, 2))
print(search(data, 2, reverse=True))
print(search(data, 2, start=2))
print(search(data, 9))

# Keywords in any order, and they document the call site.
print(search(values=data, target=2, reverse=True, start=0))`,
          output: `1
3
3
-1
3`,
          explanation:
            "One function covering four different calls. The keyword form is the real benefit: `search(data, 2, True)` would leave a reader guessing what `True` means, while `reverse=True` says it. A good habit is to make any boolean parameter keyword-only in your own head — a bare `True` at a call site is nearly always unreadable.",
        },
      ],
      pitfalls: [
        {
          title: "A mutable default",
          body: "`def f(items=[])` evaluates the default once at definition time and shares it across every call, as the previous lesson demonstrated. Use `None` as the sentinel and build the value inside. This is the single most-cited Python gotcha and it is a direct consequence of when defaults are evaluated.",
        },
      ],
    },
    {
      id: "varargs",
      heading: "A variable number of arguments",
      body: [
        "Both languages let a function accept any number of arguments.",
        "**Java** uses `Type... name`, which arrives inside the method as an array. It must be the last parameter.",
        "**Python** uses `*args` for extra positional arguments, which arrive as a tuple, and `**kwargs` for extra keyword arguments, which arrive as a dict.",
        "In this track you will use these rarely — but you will *read* them constantly, because `print(*results)` and `max(*values)` are unpacking at the call site, which is the same syntax doing the reverse job.",
      ],
      examples: [
        {
          id: "varargs",
          title: "Collecting, and the unpacking that mirrors it",
          lang: "python",
          code: `def summarise(label, *values, **options):
    total = sum(values)
    if options.get("double"):
        total *= 2
    return f"{label}: {total} from {len(values)} values"


print(summarise("a", 1, 2, 3))
print(summarise("b", 1, 2, 3, double=True))
print(summarise("c"))

# The same star, used at the call site to unpack.
data = [4, 5, 6]
print(summarise("unpacked", *data))
print(max(*data), max(data))`,
          output: `a: 6 from 3 values
b: 12 from 3 values
c: 0 from 0 values
unpacked: 15 from 3 values
6 6`,
          explanation:
            "`*values` in the definition *collects* extra arguments into a tuple; `*data` at the call site *spreads* a sequence into separate arguments. Same symbol, opposite directions. Note `max(*data)` and `max(data)` both work here but for different reasons — the first passes three arguments, the second passes one iterable, and `max` accepts either.",
        },
        {
          id: "java-varargs",
          title: "Java's varargs",
          lang: "java",
          code: `public class Main {
    static int sum(int... values) {
        int total = 0;
        for (int v : values) {
            total += v;
        }
        return total;
    }

    static String join(String separator, String... parts) {
        return String.join(separator, parts);
    }

    public static void main(String[] args) {
        System.out.println(sum());
        System.out.println(sum(1, 2, 3));
        System.out.println(sum(new int[] { 4, 5 }));
        System.out.println(join("-", "a", "b", "c"));
    }
}`,
          output: `0
6
9
a-b-c`,
          explanation:
            "`int... values` behaves as an `int[]` inside the method, so an existing array can be passed directly — which is why the third call works. Zero arguments gives an empty array rather than null, so the loop simply does not run and `sum()` is 0. The varargs parameter must come last, which is why `join` takes the separator first.",
        },
      ],
    },
    {
      id: "helper-pattern",
      heading: "The pattern recursion always needs",
      body: [
        "Here is why this lesson sits immediately before recursion.",
        "A recursive solution almost always needs **more parameters than the problem gives you** — a current index, a depth, a partial result, a visited set. But the function you must expose has the signature the problem specifies.",
        "The standard answer is two functions: a **public one with the required signature**, which sets up the extra state and calls a **private helper with the full parameter list**. Java does this with an overload or a differently-named private method; Python does it with default arguments or a nested function.",
        "You will write this shape in every backtracking problem, every tree recursion that tracks depth, and every DP that memoises. Recognising it now means it is a pattern rather than an improvisation later.",
      ],
      examples: [
        {
          id: "helper",
          title: "Three spellings of the same idea",
          lang: "python",
          code: `def max_depth_defaults(node, depth=0):
    """Extra state as a defaulted parameter."""
    if node is None:
        return depth
    left, right = node
    return max(max_depth_defaults(left, depth + 1), max_depth_defaults(right, depth + 1))


def max_depth_helper(node):
    """A public signature wrapping a private helper."""

    def walk(current, depth):
        if current is None:
            return depth
        left, right = current
        return max(walk(left, depth + 1), walk(right, depth + 1))

    return walk(node, 0)


# A tree as nested pairs: (left, right), with None for a missing child.
tree = ((None, None), ((None, None), None))

print(max_depth_defaults(tree))
print(max_depth_helper(tree))`,
          output: `3
3`,
          explanation:
            "Both compute the same depth. The defaulted-parameter version is shorter and leaks an implementation detail into the public signature — a caller could pass `depth=5` and get nonsense. The nested-helper version keeps the public signature exactly as the problem specified, which is what an interview or a judge requires. Prefer the second when the signature is fixed, and the first for your own code.",
        },
      ],
      pitfalls: [
        {
          title: "Exposing the helper's parameters as the public signature",
          body: "A judge calls `maxDepth(root)` with exactly one argument. If your solution is `maxDepth(root, depth)`, it will not be called at all, or will fail on the missing argument. Defaults hide this in Python and it is an outright compile error in Java — either way, wrap rather than widen.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is method overloading, and how does Java choose between overloads?",
      answer:
        "Several methods sharing a name with different parameter lists, resolved at compile time from the argument types. The compiler prefers an exact match, then widening — so `add(2, 3.0)` picks the `double` version by widening the `int` — then boxing. Return type is not part of the signature, so two methods differing only in what they return will not compile, because a call would give the compiler nothing to choose with.",
    },
    {
      question: "Python has no overloading. What does it use instead?",
      answer:
        "Default parameter values and keyword arguments, which cover the same ground with one function. Parameters with defaults must follow those without, and callers can pass by position or by keyword in any order. Keywords also make call sites readable — `reverse=True` says what a bare `True` would not. For genuinely different behaviour by type there is `functools.singledispatch`, but in this track defaults are enough.",
    },
    {
      question: "How do you write a recursive solution when you need extra state?",
      answer:
        "Keep the public signature the problem specifies and put the extra parameters on a private helper the public function calls. In Python that is a nested function or a defaulted parameter; in Java a private overload. It matters because a judge or an interviewer calls your function with exactly the arguments specified — widening the public signature to carry a depth or an index means it will not be called correctly. Every backtracking and memoised solution uses this shape.",
    },
  ],
  takeaways: [
    "Java overloads on parameter lists, resolved at compile time; the return type is not part of the signature",
    "Resolution prefers an exact match, then widening, then boxing — `add(2, 3.0)` picks the `double` version",
    "Python has no overloading; defaults plus keyword arguments do the same job",
    "Keyword arguments document the call site — never pass a bare boolean",
    "A mutable default is created once at definition time and shared by every call",
    "`*args` collects into a tuple, `**kwargs` into a dict; `*data` at a call site spreads",
    "Java's `Type...` arrives as an array, must be last, and is empty rather than null for zero arguments",
    "Recursion needs extra state: keep the public signature and wrap a private helper",
  ],
};
