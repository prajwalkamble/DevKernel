import type { Lesson } from "@/content/types";

export const traversalsLesson: Lesson = {
  id: "dsa-tree-traversals",
  slug: "traversals-and-what-each-is-for",
  moduleSlug: "trees",
  title: "Traversals, and What Each One Is For",
  summary:
    "Three orders, differing only in where the visit sits relative to the two recursive calls. Each answers a different kind of question, and choosing the wrong one is why some tree problems feel impossible.",
  estimatedMinutes: 35,
  objectives: [
    "Write all three traversals from the position of the visit",
    "Say which question each order answers",
    "Write the iterative in-order traversal",
    "Recognise post-order as the shape for bottom-up computation",
  ],
  sections: [
    {
      id: "one-difference",
      heading: "One line, moved",
      body: [
        "The three depth-first traversals are the same function with the visit in a different place.",
        "**Pre-order** — visit, left, right. You see a node **before** its subtrees.",
        "**In-order** — left, visit, right. You see a node **between** its subtrees.",
        "**Post-order** — left, right, visit. You see a node **after** its subtrees.",
        "That is the entire difference, and it is worth internalising as a position rather than as three memorised sequences, because the position is what tells you which one a problem needs.",
      ],
      examples: [
        {
          id: "three-orders",
          title: "Three orders, and the iterative in-order",
          lang: "python",
          code: `class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

root = Node(4, Node(2, Node(1), Node(3)), Node(7, Node(6)))

def preorder(n, out):
    if n:
        out.append(n.val); preorder(n.left, out); preorder(n.right, out)
    return out

def inorder(n, out):
    if n:
        inorder(n.left, out); out.append(n.val); inorder(n.right, out)
    return out

def postorder(n, out):
    if n:
        postorder(n.left, out); postorder(n.right, out); out.append(n.val)
    return out

def inorder_iterative(root):
    out, stack, node = [], [], root
    while node or stack:
        while node:                 # walk left, remembering the way back
            stack.append(node)
            node = node.left
        node = stack.pop()
        out.append(node.val)        # visit on the way up
        node = node.right
    return out

print("preorder: ", preorder(root, []))
print("inorder:  ", inorder(root, []))
print("postorder:", postorder(root, []))
print("iterative:", inorder_iterative(root))`,
          output: `preorder:  [4, 2, 1, 3, 7, 6]
inorder:   [1, 2, 3, 4, 6, 7]
postorder: [1, 3, 2, 6, 7, 4]
iterative: [1, 2, 3, 4, 6, 7]`,
          explanation:
            "The tree here happens to be a BST, so **in-order comes out sorted** — that is not a coincidence and it is the single most useful fact in this module. Note the iterative version matches exactly: walk left pushing every node, then pop and visit, then move right. The `while node or stack` condition is what makes it work — `node` being null does not mean finished, only that this branch is exhausted and there is a stack to unwind.",
        },
      ],
      visual: {
        id: "traversal-visual",
        kind: "tree-algorithm",
        algorithm: "inorder",
        title: "Step through each order on the same tree",
      },
    },
    {
      id: "what-each-is-for",
      heading: "Which one answers which question",
      body: [
        "**In-order, on a BST, yields sorted order.** This is the reason the BST invariant is worth having. It gives you: validate a BST by checking the sequence is increasing, find the k-th smallest by counting as you go, find a node's in-order successor, and convert a BST to a sorted list for free.",
        "**Pre-order visits a node before its children**, so it suits anything that copies or records structure top-down: serialising a tree, cloning it, or building a tree from a description. It is also the natural order for a DFS that carries information *down* — a running path, a depth, an accumulated sum.",
        "**Post-order visits a node after its children**, so it suits anything that needs answers from below before it can decide: computing height, deleting a tree safely, evaluating an expression tree, checking balance, and computing diameter. If a node's result depends on its subtrees' results, the traversal is post-order whether or not you thought of it that way.",
        "That last one is worth stating as a rule, because it converts a whole class of hard-looking problems into easy ones: **when a node's answer depends on its children's answers, write post-order and return the child's answer up**. Diameter, balance-checking, largest BST subtree and house-robber-on-a-tree are all this shape.",
      ],
    },
    {
      id: "iterative",
      heading: "The iterative forms",
      body: [
        "The recursion uses the call stack; the iterative versions manage it explicitly. The stacks module covers why you would — depth limits, and the ability to pause.",
        "**Pre-order** is the easy one: push the root; pop a node, visit it, push right then left. Right first, because the stack reverses the order and left must come out first.",
        "**In-order** is the one shown above, and the one worth memorising: walk left pushing as you go, pop and visit, then move right. It is the basis of the BST iterator, where `next()` is exactly one round of that loop.",
        "**Post-order** is genuinely awkward, because a node must be visited only after *both* children return. Two standard answers: push `(node, visited)` pairs and re-push with the flag set, or do a modified pre-order — visit, right, left — onto a second stack and then drain it, which yields post-order reversed twice into the right order.",
        "In an interview, offer the recursion first. Reach for the iterative form when the question asks for it, when depth is unbounded, or when you need an iterator.",
      ],
      pitfalls: [
        {
          title: "Assuming in-order is sorted for any binary tree",
          body: "It is sorted only for a **binary search tree**. On an arbitrary binary tree in-order is just an order. Half of the BST-specific tricks in this module quietly depend on the invariant holding.",
        },
        {
          title: "Pushing left before right in iterative pre-order",
          body: "A stack reverses. To visit left first, push right first. The result of getting it backwards is a mirror-image traversal that looks plausible until you compare it with the recursive version.",
        },
        {
          title: "Choosing pre-order where post-order was needed",
          body: "If the node's computation needs its children's results, pre-order forces you to recompute them or to pass state awkwardly downward. The give-away is a helper that returns nothing and mutates an outer variable when it could have returned a value up.",
        },
        {
          title: "Building the output list by concatenation",
          body: "`return inorder(left) + [val] + inorder(right)` is elegant and quadratic — every level re-copies the whole list. Append into one shared list, or return an iterator.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What are the three traversals and how do they differ?",
      answer:
        "Pre-order visits before recursing, in-order visits between the two recursive calls, post-order visits after both. The code is identical apart from where the visit line sits.",
    },
    {
      question: "Why is in-order special for a BST?",
      answer:
        "It yields the values in sorted order, because every node's left subtree holds smaller values and its right holds larger. That gives validation, k-th smallest, in-order successor and sorted output all from one traversal.",
    },
    {
      question: "When do you need post-order?",
      answer:
        "Whenever a node's answer depends on its children's answers — height, balance-checking, diameter, deleting a tree, evaluating an expression tree. The pattern is to return the child's computed value upward and combine at each node.",
    },
  ],
  takeaways: [
    "The three orders differ only in where the visit sits",
    "In-order on a BST is sorted — the most useful fact in the module",
    "Pre-order suits copying and carrying information downward",
    "Post-order suits anything needing results from below",
    "Iterative in-order: walk left pushing, pop and visit, go right",
    "Push right before left in iterative pre-order",
  ],
  status: "available",
};
