import type { Lesson } from "@/content/types";

export const recursionToIterationLesson: Lesson = {
  id: "dsa-sq-recursion",
  slug: "turning-recursion-into-a-stack",
  moduleSlug: "stacks-and-queues",
  title: "Turning Recursion Into a Stack",
  summary:
    "Every recursion is already using a stack — the call stack. Making it explicit removes the depth limit and makes the state visible, which is occasionally necessary and always instructive.",
  estimatedMinutes: 30,
  objectives: [
    "Explain what a stack frame holds",
    "Convert a simple recursion to an explicit stack",
    "Say why the conversion is harder when work follows the recursive call",
    "Decide when the conversion is worth doing",
  ],
  sections: [
    {
      id: "the-call-stack",
      heading: "What the call stack is holding",
      body: [
        "When a function calls itself, the runtime pushes a **frame** containing the arguments, the local variables, and the point to return to. Returning pops it and resumes there.",
        "So a recursion is a stack-driven loop where the language manages the stack. Writing the stack yourself changes nothing about the algorithm — only about who allocates the memory.",
        "Two consequences follow. The call stack is a fixed-size region — typically around 1 MB, giving a few thousand frames — so deep recursion overflows where an explicit stack on the heap would not. Python's limit is 1000 by default and is a hard error rather than a crash. And an explicit stack lets you *inspect* the pending work, which is occasionally what a problem asks for.",
      ],
      visual: {
        id: "stack-frames-visual",
        kind: "stack",
        title: "Frames pushed on the way down, popped on the way back",
      },
    },
    {
      id: "the-easy-case",
      heading: "The easy case: nothing after the call",
      body: [
        "When the recursive call is the **last** thing a function does — tail position — the conversion is mechanical. There is nothing to come back to, so no return state needs saving. A loop that updates the arguments replaces it entirely.",
        "`gcd(a, b) = gcd(b, a % b)` becomes `while b: a, b = b, a % b`. No stack at all.",
        "The near-tail case — a recursion with several calls, none of which is followed by further work — needs a stack but no bookkeeping. Iterative DFS on a graph is the standard example: push the start, and repeatedly pop a node, visit it, and push its unvisited neighbours. That is the whole conversion.",
        "One difference worth knowing: pushing neighbours in order and popping them reverses the visit order relative to the recursive version. If the traversal order matters — and for output-comparison problems it does — push the neighbours in reverse.",
      ],
    },
    {
      id: "the-hard-case",
      heading: "The hard case: work after the call",
      body: [
        "When something must happen *after* the recursive call returns — a post-order traversal, an accumulation, a cleanup — the conversion needs the return state to be explicit. There are two standard techniques.",
        "**A state flag per frame.** Push `(node, visited)` pairs. On popping an unvisited node, push it back marked visited, then push its children. When a node comes back up already marked, do the post-order work. This handles arbitrary post-processing and generalises to any traversal order.",
        "**Two stacks, for post-order specifically.** Do a modified pre-order pushing onto a second stack, then drain it. Shorter, and only works for the standard post-order shape.",
        "The backtracking case is different again: an explicit stack must un-apply the choice on the way back up, which is the `un-choose` step the recursion got for free by unwinding. Forgetting it is the characteristic bug of hand-converted backtracking.",
        "The honest guidance: unless depth is a genuine problem, **leave it recursive**. The recursive form is shorter, its correctness is easier to see, and the conversion introduces exactly the class of bug this module is about. Convert when you must, not to prove you can.",
      ],
      pitfalls: [
        {
          title: "Reversed traversal order",
          body: "Pushing children left-to-right and popping visits them right-to-left. Push in reverse order to match the recursion, or accept the difference deliberately — a lot of 'my iterative version gives a different answer' is exactly this.",
        },
        {
          title: "Forgetting to un-apply state on the way up",
          body: "Recursion undoes local state by unwinding. An explicit stack does not, so any mutation applied on the way down — marking visited, appending to a path — must be undone explicitly when the frame is finished.",
        },
        {
          title: "Converting when the recursion was fine",
          body: "An iterative version is usually two to three times longer and materially harder to verify. Depth of about a million is where a stack overflow becomes a real risk; below that the recursion is the better code.",
        },
        {
          title: "Assuming tail-call optimisation",
          body: "Python and Java do not perform it, so a tail-recursive function still consumes a frame per call. C++ and Rust compilers often do at optimisation levels but do not guarantee it. Never rely on it for correctness.",
        },
      ],
    },
    {
      id: "where-it-matters",
      heading: "Where the conversion earns its keep",
      body: [
        "**Very deep recursion.** A degenerate binary tree of a million nodes is a chain, and any recursive traversal of it overflows. An explicit stack on the heap does not.",
        "**Iterative in-order traversal.** The standard technique — walk left pushing as you go, then pop, visit, and move right — is the basis of a BST iterator with O(h) space, and `next()` on that iterator is a genuinely useful thing that a recursion cannot express.",
        "**Pause and resume.** An iterator must be able to stop mid-traversal and continue later. A recursion cannot be suspended without generators or coroutines; an explicit stack is just a data structure you can put down.",
        "**Debugging.** When a recursion is wrong, printing the explicit stack shows the pending work directly.",
        "The BST iterator is the one worth writing. It appears as its own interview question, it is the clearest demonstration of why explicit state beats implicit, and it makes the connection between this module and the trees module concrete.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you convert a recursion to an iteration?",
      answer:
        "Make the call stack explicit. If nothing follows the recursive call, a loop or a plain stack of pending items suffices. If work happens after the call returns, each entry needs a state flag — push the node back marked visited before pushing its children — so the post-processing runs when it comes back up.",
    },
    {
      question: "Why would you want an iterative traversal?",
      answer:
        "To avoid stack overflow on very deep structures, and to be able to pause and resume — which is what a BST iterator needs. The call stack cannot be suspended and inspected; an explicit stack is an ordinary object.",
    },
    {
      question: "Implement a BST iterator with O(h) space.",
      answer:
        "Keep a stack, and push the leftmost spine from the root. `next()` pops a node, then pushes the leftmost spine of its right child. Each node is pushed and popped once, so `next()` is amortised O(1) and the stack never exceeds the tree's height.",
    },
  ],
  takeaways: [
    "A frame holds arguments, locals and the return point",
    "Tail position converts to a loop with no stack at all",
    "Work after the call needs an explicit visited flag per entry",
    "Pushing children in order reverses the visit order",
    "Explicit stacks must un-apply what recursion undid by unwinding",
    "Convert for depth or resumability — otherwise leave it recursive",
  ],
  status: "available",
};
