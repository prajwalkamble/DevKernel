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
          alternates: [
            {
              lang: "javascript",
              code: `class Node {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

//        10
//       /  \\
//      5    15
//          /  \\
//         6    20      <- 6 is less than 10, so this is NOT a BST
const bad = new Node(10, new Node(5), new Node(15, new Node(6), new Node(20)));
const good = new Node(10, new Node(5), new Node(15, new Node(12), new Node(20)));

// Only compares each node with its own children. Wrong.
function validLocal(node) {
  if (node === null) return true;
  if (node.left && node.left.val >= node.val) return false;
  if (node.right && node.right.val <= node.val) return false;
  return validLocal(node.left) && validLocal(node.right);
}

// Carries the range each subtree is allowed to occupy. Right.
function valid(node, low = null, high = null) {
  if (node === null) return true;
  if (low !== null && node.val <= low) return false;
  if (high !== null && node.val >= high) return false;
  return valid(node.left, low, node.val) && valid(node.right, node.val, high);
}

console.log("local check says bad tree is valid:", validLocal(bad));
console.log("range check says bad tree is valid:", valid(bad));
console.log("range check says good tree is valid:", valid(good));`,
              output: `local check says bad tree is valid: true
range check says bad tree is valid: false
range check says good tree is valid: true`,
            },
            {
              lang: "typescript",
              code: `class Node {
  val: number;
  left: Node | null;
  right: Node | null;

  constructor(val: number, left: Node | null = null, right: Node | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

//        10
//       /  \\
//      5    15
//          /  \\
//         6    20      <- 6 is less than 10, so this is NOT a BST
const bad = new Node(10, new Node(5), new Node(15, new Node(6), new Node(20)));
const good = new Node(10, new Node(5), new Node(15, new Node(12), new Node(20)));

// Only compares each node with its own children. Wrong.
function validLocal(node: Node | null): boolean {
  if (node === null) return true;
  if (node.left && node.left.val >= node.val) return false;
  if (node.right && node.right.val <= node.val) return false;
  return validLocal(node.left) && validLocal(node.right);
}

// Carries the range each subtree is allowed to occupy. Right.
function valid(node: Node | null, low: number | null = null, high: number | null = null): boolean {
  if (node === null) return true;
  if (low !== null && node.val <= low) return false;
  if (high !== null && node.val >= high) return false;
  return valid(node.left, low, node.val) && valid(node.right, node.val, high);
}

console.log("local check says bad tree is valid:", validLocal(bad));
console.log("range check says bad tree is valid:", valid(bad));
console.log("range check says good tree is valid:", valid(good));`,
              output: `local check says bad tree is valid: true
range check says bad tree is valid: false
range check says good tree is valid: true`,
            },
            {
              lang: "java",
              code: `public class Main {
    static class Node {
        int val;
        Node left, right;

        Node(int val) { this.val = val; }

        Node(int val, Node left, Node right) {
            this.val = val;
            this.left = left;
            this.right = right;
        }
    }

    /** Only compares each node with its own children. Wrong. */
    static boolean validLocal(Node node) {
        if (node == null) return true;
        if (node.left != null && node.left.val >= node.val) return false;
        if (node.right != null && node.right.val <= node.val) return false;
        return validLocal(node.left) && validLocal(node.right);
    }

    /** Carries the range each subtree is allowed to occupy. Right. */
    static boolean valid(Node node, Integer low, Integer high) {
        if (node == null) return true;
        if (low != null && node.val <= low) return false;
        if (high != null && node.val >= high) return false;
        return valid(node.left, low, node.val) && valid(node.right, node.val, high);
    }

    public static void main(String[] args) {
        //        10
        //       /  \\
        //      5    15
        //          /  \\
        //         6    20      <- 6 is less than 10, so this is NOT a BST
        Node bad = new Node(10, new Node(5), new Node(15, new Node(6), new Node(20)));
        Node good = new Node(10, new Node(5), new Node(15, new Node(12), new Node(20)));

        System.out.println("local check says bad tree is valid: " + validLocal(bad));
        System.out.println("range check says bad tree is valid: " + valid(bad, null, null));
        System.out.println("range check says good tree is valid: " + valid(good, null, null));
    }
}`,
              output: `local check says bad tree is valid: true
range check says bad tree is valid: false
range check says good tree is valid: true`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <optional>
using namespace std;

struct Node {
    int val;
    Node* left;
    Node* right;
    Node(int val, Node* left = nullptr, Node* right = nullptr)
        : val(val), left(left), right(right) {}
};

// Only compares each node with its own children. Wrong.
bool validLocal(Node* node) {
    if (!node) return true;
    if (node->left && node->left->val >= node->val) return false;
    if (node->right && node->right->val <= node->val) return false;
    return validLocal(node->left) && validLocal(node->right);
}

// Carries the range each subtree is allowed to occupy. Right.
bool valid(Node* node, optional<int> low = nullopt, optional<int> high = nullopt) {
    if (!node) return true;
    if (low && node->val <= *low) return false;
    if (high && node->val >= *high) return false;
    return valid(node->left, low, node->val) && valid(node->right, node->val, high);
}

int main() {
    //        10
    //       /  \\
    //      5    15
    //          /  \\
    //         6    20      <- 6 is less than 10, so this is NOT a BST
    Node* bad = new Node(10, new Node(5), new Node(15, new Node(6), new Node(20)));
    Node* good = new Node(10, new Node(5), new Node(15, new Node(12), new Node(20)));

    cout << boolalpha;
    cout << "local check says bad tree is valid: " << validLocal(bad) << "\\n";
    cout << "range check says bad tree is valid: " << valid(bad) << "\\n";
    cout << "range check says good tree is valid: " << valid(good) << "\\n";
}`,
              output: `local check says bad tree is valid: true
range check says bad tree is valid: false
range check says good tree is valid: true`,
            },
            {
              lang: "rust",
              code: `struct Node {
    val: i32,
    left: Option<Box<Node>>,
    right: Option<Box<Node>>,
}

fn node(val: i32, left: Option<Box<Node>>, right: Option<Box<Node>>) -> Option<Box<Node>> {
    Some(Box::new(Node { val, left, right }))
}

fn leaf(val: i32) -> Option<Box<Node>> {
    node(val, None, None)
}

/// Only compares each node with its own children. Wrong.
fn valid_local(n: &Option<Box<Node>>) -> bool {
    let node = match n {
        None => return true,
        Some(node) => node,
    };
    if node.left.as_ref().is_some_and(|c| c.val >= node.val) {
        return false;
    }
    if node.right.as_ref().is_some_and(|c| c.val <= node.val) {
        return false;
    }
    valid_local(&node.left) && valid_local(&node.right)
}

/// Carries the range each subtree is allowed to occupy. Right.
fn valid(n: &Option<Box<Node>>, low: Option<i32>, high: Option<i32>) -> bool {
    let node = match n {
        None => return true,
        Some(node) => node,
    };
    if low.is_some_and(|l| node.val <= l) {
        return false;
    }
    if high.is_some_and(|h| node.val >= h) {
        return false;
    }
    valid(&node.left, low, Some(node.val)) && valid(&node.right, Some(node.val), high)
}

fn main() {
    //        10
    //       /  \\
    //      5    15
    //          /  \\
    //         6    20      <- 6 is less than 10, so this is NOT a BST
    let bad = node(10, leaf(5), node(15, leaf(6), leaf(20)));
    let good = node(10, leaf(5), node(15, leaf(12), leaf(20)));

    println!("local check says bad tree is valid: {}", valid_local(&bad));
    println!("range check says bad tree is valid: {}", valid(&bad, None, None));
    println!("range check says good tree is valid: {}", valid(&good, None, None));
}`,
              output: `local check says bad tree is valid: true
range check says bad tree is valid: false
range check says good tree is valid: true`,
            },
            {
              lang: "go",
              code: `package main

import "fmt"

type Node struct {
	val         int
	left, right *Node
}

// Only compares each node with its own children. Wrong.
func validLocal(node *Node) bool {
	if node == nil {
		return true
	}
	if node.left != nil && node.left.val >= node.val {
		return false
	}
	if node.right != nil && node.right.val <= node.val {
		return false
	}
	return validLocal(node.left) && validLocal(node.right)
}

// Carries the range each subtree is allowed to occupy. Right.
func valid(node *Node, low, high *int) bool {
	if node == nil {
		return true
	}
	if low != nil && node.val <= *low {
		return false
	}
	if high != nil && node.val >= *high {
		return false
	}
	return valid(node.left, low, &node.val) && valid(node.right, &node.val, high)
}

func main() {
	//        10
	//       /  \\
	//      5    15
	//          /  \\
	//         6    20      <- 6 is less than 10, so this is NOT a BST
	bad := &Node{10, &Node{val: 5}, &Node{15, &Node{val: 6}, &Node{val: 20}}}
	good := &Node{10, &Node{val: 5}, &Node{15, &Node{val: 12}, &Node{val: 20}}}

	fmt.Println("local check says bad tree is valid:", validLocal(bad))
	fmt.Println("range check says bad tree is valid:", valid(bad, nil, nil))
	fmt.Println("range check says good tree is valid:", valid(good, nil, nil))
}`,
              output: `local check says bad tree is valid: true
range check says bad tree is valid: false
range check says good tree is valid: true`,
            },
          ],
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
