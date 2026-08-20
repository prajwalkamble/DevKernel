import type { Lesson } from "@/content/types";

export const validatingBstLesson: Lesson = {
  id: "dsa-tree-validate",
  slug: "why-validating-a-bst-is-not-local",
  moduleSlug: "trees",
  title: "Why Validating a BST Is Not a Local Check",
  summary:
    "The obvious solution — compare each node with its children — passes trees that are not BSTs. The invariant is about subtrees, so the check has to carry a range downward. This is the module's most instructive bug.",
  estimatedMinutes: 30,
  objectives: [
    "Construct a tree the local check wrongly accepts",
    "Write the range-carrying validation",
    "Write the in-order alternative and say when each is better",
    "Handle the integer-bound edge case cleanly",
  ],
  sections: [
    {
      id: "the-wrong-answer",
      heading: "The check that looks right",
      body: [
        "The natural first attempt: at every node, confirm the left child is smaller and the right child is larger, then recurse.",
        "It is wrong, and the counterexample is small enough to hold in your head. Take root 10, left child 5, right child 15 — fine so far. Give 15 a left child of 6.",
        "Every local comparison passes: 6 is less than 15, so it is correctly placed as 15's left child. But 6 sits in **10's right subtree**, and the invariant says everything there must exceed 10. Searching for 6 from the root would go right, then left, and find it — but searching for 6 in a valid BST would go *left* at the root, so the structure is broken in a way that breaks search.",
        "The lesson generalises: the invariant constrains a node against **every ancestor**, not just its parent. A check that only looks one level cannot see that.",
      ],
      examples: [
        {
          id: "local-vs-range",
          title: "The same tree, two verdicts",
          lang: "python",
          code: `class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

#        10
#       /  \\
#      5    15
#          /  \\
#         6    20      <- 6 is less than 10, so this is NOT a BST
bad = Node(10, Node(5), Node(15, Node(6), Node(20)))
good = Node(10, Node(5), Node(15, Node(12), Node(20)))

def valid_local(node):
    """Only compares each node with its own children. Wrong."""
    if node is None:
        return True
    if node.left and node.left.val >= node.val:
        return False
    if node.right and node.right.val <= node.val:
        return False
    return valid_local(node.left) and valid_local(node.right)

def valid(node, low=None, high=None):
    """Carries the range each subtree is allowed to occupy. Right."""
    if node is None:
        return True
    if low is not None and node.val <= low:
        return False
    if high is not None and node.val >= high:
        return False
    return valid(node.left, low, node.val) and valid(node.right, node.val, high)

print("local check says bad tree is valid:", valid_local(bad))
print("range check says bad tree is valid:", valid(bad))
print("range check says good tree is valid:", valid(good))`,
          output: `local check says bad tree is valid: True
range check says bad tree is valid: False
range check says good tree is valid: True`,
          explanation:
            "The local check returns **True** for a tree that is not a BST — a wrong answer, not a slow one, which is why this is worth writing out once. The range version passes each subtree the window it is permitted to occupy: descending left tightens the upper bound to the current value, descending right tightens the lower bound. By the time the recursion reaches 6, its window is `(10, 15)` and 6 falls outside it.",
        },
      ],
      visual: {
        id: "validate-visual",
        kind: "bst",
        title: "A valid BST — every node inside the window its ancestors allow",
      },
    },
    {
      id: "the-two-solutions",
      heading: "Two correct approaches",
      body: [
        "**Carry a range.** Each call receives the open interval its subtree must lie in. The root gets `(−∞, +∞)`; going left replaces the upper bound with the current value, going right replaces the lower bound. O(n) time, O(h) stack.",
        "**Walk in-order and check it increases.** Since in-order on a valid BST is sorted, keep the previously visited value and confirm each node exceeds it. Also O(n) time and O(h) space.",
        "Both are correct and either is a fine answer. The range version generalises better — it is the same shape as \"largest BST subtree\" and \"recover a swapped BST\" — while the in-order version is shorter and makes the connection to sortedness explicit.",
        "The in-order version has one trap worth naming: the comparison must be **strictly** greater than the previous value if duplicates are disallowed, and the `previous` variable must persist across the whole traversal rather than being reset per subtree. Passing it as a mutable holder or using an iterative traversal avoids the usual mistake of making it a local.",
      ],
      pitfalls: [
        {
          title: "Comparing only with the immediate children",
          body: "The bug this lesson exists for. It accepts invalid trees and it is the single most common wrong answer to this question. The invariant is about subtrees, so the check must be too.",
        },
        {
          title: "Using integer minimum and maximum as the initial bounds",
          body: "If a node legitimately holds `Integer.MIN_VALUE`, a check written as `val > low` with `low` initialised to that value rejects a valid tree. Use null or optional bounds and skip the comparison when absent, as above — or use a language-appropriate infinity.",
        },
        {
          title: "Resetting the previous value per subtree",
          body: "In the in-order approach, `previous` must span the entire traversal. Declared inside the recursive helper it resets, and the check silently becomes local again — the same bug in different clothing.",
        },
        {
          title: "Getting the duplicate policy wrong",
          body: "Whether equal values are allowed, and on which side, has to match how the tree was built. Most problem statements forbid duplicates entirely, which makes both bounds strict.",
        },
      ],
    },
    {
      id: "the-family",
      heading: "Problems with the same shape",
      body: [
        "**Recover Binary Search Tree.** Exactly two nodes were swapped; restore it without changing structure. In-order, find the two places where the sequence decreases, swap those values back. The subtlety is that adjacent swaps produce one violation rather than two.",
        "**Largest BST Subtree.** Post-order, returning from each node whether its subtree is a BST along with its min, max and size. A node's answer needs its children's answers — the post-order rule from lesson 2.",
        "**Kth Smallest Element in a BST.** In-order with a counter, stopping early. The follow-up — many queries on a changing tree — wants each node augmented with its subtree size, which is the augmentation idea from the stacks module applied to trees.",
        "**Range Sum of BST.** Sum values within `[low, high]`, pruning subtrees that cannot contain any. The pruning is the point: if a node's value is below `low`, its entire left subtree is irrelevant.",
        "**Convert Sorted Array to BST.** The inverse: take the middle as the root and recurse on the halves, which produces a balanced tree by construction.",
        "The common thread is that a BST's ordering is **global information available locally** — provided you carry the right context down or return the right summary up. Which direction you need is exactly the pre-order/post-order choice from lesson 2.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Validate a binary search tree.",
      answer:
        "Carry the permitted open interval down: the root may be anything, going left tightens the upper bound to the current value, going right tightens the lower bound. Or walk in-order and check the sequence strictly increases. Comparing each node only with its children is the classic wrong answer — it accepts a tree where a node violates a distant ancestor.",
    },
    {
      question: "Give a tree the local check wrongly accepts.",
      answer:
        "Root 10, left 5, right 15, and 15's left child is 6. Every parent-child comparison passes, but 6 is in the root's right subtree and is less than 10, so the tree is not a BST and searching for 6 from the root takes the wrong branch.",
    },
    {
      question: "Why not use Integer.MIN_VALUE as the initial lower bound?",
      answer:
        "A node may legitimately hold that value, and a strict comparison against it would reject a valid tree. Use null or optional bounds and skip the comparison when a bound is absent.",
    },
  ],
  takeaways: [
    "The invariant constrains a node against every ancestor, not its parent",
    "The local check returns a wrong answer, not a slow one",
    "Carry an open interval down; left tightens the top, right the bottom",
    "In-order and checking it increases is the equally valid alternative",
    "Never seed the bounds with the integer extremes",
    "Context down is pre-order; summaries up is post-order",
  ],
  status: "available",
};
