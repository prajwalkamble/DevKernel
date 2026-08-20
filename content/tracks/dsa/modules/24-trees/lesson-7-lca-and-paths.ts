import type { Lesson } from "@/content/types";

export const lcaAndPathsLesson: Lesson = {
  id: "dsa-tree-paths",
  slug: "lowest-common-ancestor-and-paths",
  moduleSlug: "trees",
  title: "Lowest Common Ancestor, Diameter, and Paths",
  summary:
    "A family of problems solved by the same move: return something useful from each subtree and decide at the node where the two answers meet. Once you see the shape, six problems collapse into one.",
  estimatedMinutes: 35,
  objectives: [
    "Write the general LCA and explain why it works",
    "Use the BST version's shortcut",
    "Compute the diameter with a height traversal",
    "Recognise the return-a-summary-upward pattern",
  ],
  sections: [
    {
      id: "lca",
      heading: "Lowest common ancestor",
      body: [
        "The lowest node having both targets somewhere below it — where a node counts as its own descendant.",
        "The recursion is four lines and worth understanding rather than memorising. At a node: if it is null or is one of the targets, return it. Otherwise recurse both sides.",
        "If **both** sides return something, the targets are on opposite sides, so this node is where they meet — return it. If only **one** side returns something, both targets are down that side, so pass that answer up unchanged.",
        "What is actually being returned is subtle and worth stating: it is either a found target or a confirmed meeting point, and the node cannot tell which. It does not need to. The first node that sees both sides non-null is necessarily the lowest such node, because any node below it would have seen only one.",
        "This assumes both targets are present. If they might not be, the plain version returns a target when only one exists — so a problem that permits absence needs a second pass to confirm, or the search must return a count as well as a node.",
      ],
      examples: [
        {
          id: "lca-diameter",
          title: "LCA, and diameter from a height traversal",
          lang: "python",
          code: `class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

#        3
#      /   \\
#     5     1
#    / \\   / \\
#   6   2 0   8
#      / \\
#     7   4
root = Node(3,
            Node(5, Node(6), Node(2, Node(7), Node(4))),
            Node(1, Node(0), Node(8)))

def lca(node, a, b):
    """The first node where a and b are on different sides — or is one of them."""
    if node is None or node.val == a or node.val == b:
        return node
    left = lca(node.left, a, b)
    right = lca(node.right, a, b)
    if left and right:
        return node            # they split here, so this is the meeting point
    return left or right

diameter = 0

def depth(node):
    """Height, while recording the longest path that bends at each node."""
    global diameter
    if node is None:
        return 0
    l, r = depth(node.left), depth(node.right)
    diameter = max(diameter, l + r)
    return 1 + max(l, r)

print("lca(5, 1):", lca(root, 5, 1).val)
print("lca(6, 4):", lca(root, 6, 4).val)
print("lca(7, 4):", lca(root, 7, 4).val)
depth(root)
print("diameter (edges):", diameter)`,
          output: `lca(5, 1): 3
lca(6, 4): 5
lca(7, 4): 2
diameter (edges): 5`,
          explanation:
            "`lca(5, 1)` is the root, because the targets are in different halves. `lca(6, 4)` is 5 — both are below it and they split there. The diameter function is the pattern in miniature: it is a **height** traversal, and the diameter is computed as a side effect at each node. The longest path either passes through this node, costing `left + right`, or lies entirely within one subtree, which the recursion has already considered. Returning `1 + max(l, r)` is the height; the `max` into `diameter` is the answer. The result 5 is the path 6→5→2→7 extended — precisely, 7→2→5→3→1→0, which is five edges.",
        },
      ],
    },
    {
      id: "bst-shortcut",
      heading: "The BST shortcut, and other variants",
      body: [
        "On a **BST** the LCA needs no recursion into both sides. Descend from the root: if both targets are smaller, go left; if both are larger, go right; otherwise this node is the split point and therefore the LCA. O(h) time and O(1) space iteratively.",
        "That works because the invariant tells you which side a value is on without looking, which is the recurring payoff of having an ordering.",
        "**With parent pointers**, LCA becomes the intersection problem from the linked-lists module: walk up from both nodes and find where the two upward paths meet — the two-cursor trick applies unchanged.",
        "**For many queries on a fixed tree**, precompute with binary lifting: store each node's 2^k-th ancestor, then answer each query in O(log n) after O(n log n) preprocessing. This is the version that appears in competitive programming rather than interviews.",
        "**For an n-ary tree**, the same recursion works with a loop over children instead of two calls, counting how many children returned non-null.",
      ],
      pitfalls: [
        {
          title: "Assuming both targets exist",
          body: "The four-line version returns a target node when only that one is present, which looks like a valid LCA. If absence is possible, track whether both were actually found rather than trusting a non-null return.",
        },
        {
          title: "Making diameter count nodes when the problem wants edges",
          body: "`l + r` is the edge count; `l + r + 1` is the node count. Both conventions appear in problem statements. Read which is wanted — the sample output usually disambiguates it faster than the prose.",
        },
        {
          title: "Recomputing height inside the diameter loop",
          body: "Calling a separate `height()` at every node makes diameter O(n²). The single traversal above computes height and diameter together, which is the whole trick — one pass, answers combined on the way up.",
        },
        {
          title: "Using a global for the accumulator",
          body: "Fine in a script, awkward in a method and hostile to concurrency. Prefer returning a pair, or use a one-element array or a nonlocal in languages where that is idiomatic. The example above uses a global purely to keep the recursion legible.",
        },
      ],
    },
    {
      id: "the-family",
      heading: "The family, and the shape they share",
      body: [
        "**Diameter of a Binary Tree** — as above.",
        "**Binary Tree Maximum Path Sum** — the same traversal, but a subtree contributes `max(0, its best)` since a negative branch is better skipped, and the candidate answer at each node is `node + left + right`. The distinction between what you *return* — a single downward path — and what you *record* — a path that bends here — is the entire difficulty.",
        "**Balanced Binary Tree** — return the height, or a sentinel meaning \"already unbalanced\", so the whole check is one pass instead of a height call per node.",
        "**Path Sum I, II and III** — the first two carry a running total downward, which is pre-order. The third counts paths starting anywhere and is prefix-sums-plus-a-hash-map from the hashing module, applied along a root-to-node path with the map undone on the way back up.",
        "**Longest Univalue Path**, **Longest ZigZag Path** — same shape, different quantity returned.",
        "**Count Good Nodes** — carries the maximum-so-far downward, which is pre-order rather than post-order. Worth doing right after the others to feel the difference in direction.",
        "The shape shared by nearly all of them: **return one thing upward, record another at each node**. The returned value must describe a path that can still be extended by the parent; the recorded value may be a path that bends and therefore cannot. Keeping those two straight is what makes this family tractable.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Find the lowest common ancestor of two nodes in a binary tree.",
      answer:
        "Recurse: return the node if it is null or is one of the targets. If both children return non-null the targets split here, so this node is the LCA; otherwise pass up whichever side was non-null. O(n) time, O(h) stack. On a BST, descend by comparison instead and it is O(h) with no recursion.",
    },
    {
      question: "Compute the diameter in one pass.",
      answer:
        "Write a height traversal and, at each node, record `left + right` as a candidate answer before returning `1 + max(left, right)`. The path either bends at this node — the candidate — or lies within a subtree, which the recursion has already considered. Calling a separate height function per node would make it O(n²).",
    },
    {
      question: "In maximum path sum, why does the return value differ from the answer?",
      answer:
        "The parent can only extend a path that goes straight down through one child, so the return value is `node + max(0, best child)`. The answer may bend at this node and use both children, so `node + left + right` is recorded separately. Returning the bent value would let the parent build an impossible path.",
    },
  ],
  takeaways: [
    "LCA: return a target or a meeting point; both sides non-null means split",
    "The first node seeing both sides is necessarily the lowest",
    "On a BST, descend by comparison — no recursion needed",
    "Diameter is a height traversal with a max recorded at each node",
    "Return what the parent can extend; record what bends here",
    "Absence of a target breaks the plain LCA — check for it",
  ],
  status: "available",
};
