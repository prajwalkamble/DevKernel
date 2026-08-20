import type { Lesson } from "@/content/types";

export const callStackLesson: Lesson = {
  id: "dsa-rec-stack",
  slug: "the-call-stack-and-converting-to-iteration",
  moduleSlug: "recursion-and-backtracking",
  title: "The Call Stack & Converting to Iteration",
  summary:
    "Recursion is not free: every pending call is a stack frame, and the stack is small. Where the limit sits, why Java will not save you with tail calls, and the mechanical conversion when you hit it.",
  estimatedMinutes: 30,
  objectives: [
    "Say what a stack frame holds and roughly how deep you can go",
    "Recognise the input sizes where recursion depth becomes a risk",
    "Explain why tail-call elimination does not help in Java or Python",
    "Convert a recursion to an explicit stack mechanically",
  ],
  sections: [
    {
      id: "the-cost",
      heading: "What recursion costs",
      body: [
        "Each pending call holds a **stack frame**: its parameters, its locals, and where to return to. Frames are freed only when the call returns — so a recursion `n` deep holds `n` frames at once, and that is O(n) memory nobody wrote down.",
        "The stack is also much smaller than the heap. A JVM thread defaults to around 512 KB to 1 MB, and CPython caps recursion at 1000 frames by default regardless of memory.",
      ],
      examples: [
        {
          id: "stack-depth",
          title: "Where the limit actually sits",
          lang: "java",
          code: `import java.util.*;

public class Main {
    static int depth = 0;

    static void dive() {
        depth++;
        dive();
    }

    // Recursive: one stack frame per element.
    static long sumRec(int[] a, int i) {
        if (i == a.length) return 0;
        return a[i] + sumRec(a, i + 1);
    }

    // Iterative: the same computation, one frame total.
    static long sumIter(int[] a) {
        long total = 0;
        for (int v : a) total += v;
        return total;
    }

    public static void main(String[] args) {
        try {
            dive();
        } catch (StackOverflowError e) {
            // The exact depth depends on the JVM, the platform and the frame
            // size, so assert the shape rather than printing a number that
            // will not reproduce.
            System.out.println("StackOverflowError thrown; depth reached was");
            System.out.println("  more than 1,000:   " + (depth > 1_000));
            System.out.println("  less than 200,000: " + (depth < 200_000));
        }

        int[] small = new int[1000];
        Arrays.fill(small, 1);
        System.out.println("\\nsumRec  on 1,000 elements = " + sumRec(small, 0));
        System.out.println("sumIter on 1,000 elements = " + sumIter(small));

        int[] big = new int[200_000];
        Arrays.fill(big, 1);
        System.out.println("\\nsumIter on 200,000 elements = " + sumIter(big));
        try {
            System.out.println("sumRec  on 200,000 elements = " + sumRec(big, 0));
        } catch (StackOverflowError e) {
            System.out.println("sumRec  on 200,000 elements -> StackOverflowError");
        }

        System.out.println("\\nJava does not do tail-call elimination, so a tail-recursive");
        System.out.println("function still consumes one frame per call.");
    }
}`,
          output: `StackOverflowError thrown; depth reached was
  more than 1,000:   true
  less than 200,000: true

sumRec  on 1,000 elements = 1000
sumIter on 1,000 elements = 1000

sumIter on 200,000 elements = 200000
sumRec  on 200,000 elements -> StackOverflowError

Java does not do tail-call elimination, so a tail-recursive
function still consumes one frame per call.`,
          explanation:
            "The depth is asserted rather than printed, because it depends on the JVM, the platform and the size of each frame — a number here would be a number you could not reproduce. What is stable is the *shape*: comfortably past a thousand, nowhere near two hundred thousand.\n\nThat band is the practical rule. **Recursion depth up to a few thousand is safe; depth in the hundreds of thousands is not.** A problem with `n ≤ 10^5` and a linear recursion — a linked list walked recursively, a DFS on a path-shaped graph — will overflow, and it will do so only on the largest test.",
        },
      ],
    },
    {
      id: "tail-calls",
      heading: "Why tail calls do not save you",
      body: [
        "A **tail call** is a recursive call whose result is returned directly, with no pending work after it. In principle the current frame could be reused rather than stacked, making the recursion constant-space — that is tail-call elimination.",
        "**Java does not do it. Python does not do it. C++ and Go compilers may, at some optimisation levels, with no guarantee.** Only languages that promise it — Scheme, and Scala for direct self-recursion — can be relied on.",
        "Guido van Rossum has been explicit that Python will not add it, on the grounds that it destroys stack traces. So writing a function in tail form is a good habit for readability and buys you nothing for depth. If depth is the problem, convert to iteration.",
      ],
    },
    {
      id: "converting",
      heading: "The mechanical conversion",
      body: [
        "**Linear recursion** — one recursive call, in tail position — becomes a loop directly. `sumRec` becomes `sumIter` above with no cleverness required.",
        "**Linear recursion with pending work** — like `factorial`, where you multiply *after* the call returns — becomes a loop with an accumulator, running in the opposite order.",
        "**Branching recursion** — two or more calls, like a tree traversal — needs an **explicit stack**. Push what you would have recursed on, pop in a loop, and push children as you go. This is exactly the same work; the difference is that a heap-allocated stack can hold millions of entries where the call stack cannot.",
        "The trees module builds the iterative traversals properly. The point here is that the conversion is mechanical, not inventive: you are moving the stack from one place to another.",
      ],
      pitfalls: [
        {
          title: "Raising Python's recursion limit as a fix",
          body: "`sys.setrecursionlimit(10**6)` removes Python's own guard but not the operating system's stack, so instead of a catchable `RecursionError` you get a segmentation fault. It is occasionally the right call in a contest with a known depth; it is never the right call in production.",
        },
        {
          title: "Recursing over a linked list",
          body: "The single most common overflow in interview code. A list of 10⁵ nodes is a recursion 10⁵ deep. Every linked-list algorithm has an iterative form and it is usually shorter.",
        },
        {
          title: "Assuming a balanced tree",
          body: "DFS on a balanced tree is O(log n) deep and perfectly safe. On a degenerate tree — every node with one child — it is O(n) deep, and \"the tree might be a straight line\" is exactly the test case a grader includes.",
        },
      ],
    },
  ],
  takeaways: [
    "Every pending call holds a frame; depth n costs O(n) stack memory",
    "Safe to a few thousand; unsafe in the hundreds of thousands",
    "Java, Python and CPython do not eliminate tail calls",
    "Linear recursion converts to a loop; branching recursion needs an explicit stack",
    "Raising Python's limit trades a clean error for a segfault",
    "Never recurse over a linked list of unbounded length",
    "A tree may be degenerate — depth is O(n), not O(log n), in the worst case",
  ],
  status: "available",
};
