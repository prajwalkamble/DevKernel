import type { Lesson } from "@/content/types";

export const shapeAndTerminologyLesson: Lesson = {
  id: "dsa-tree-shape",
  slug: "shape-height-and-terminology",
  moduleSlug: "trees",
  title: "Shape, Height, and Why It Decides Everything",
  summary:
    "A tree is a node with subtrees, which is why every algorithm here is three lines of recursion. What varies is the shape — and the gap between O(log n) and O(n) is entirely a question of shape.",
  estimatedMinutes: 30,
  objectives: [
    "Define height, depth, size and the standard node relationships",
    "Write the recursive shape that nearly every tree function follows",
    "Explain why a degenerate tree is a linked list",
    "Distinguish full, complete, perfect and balanced",
  ],
  sections: [
    {
      id: "recursive-definition",
      heading: "A tree is a node with subtrees",
      body: [
        "The definition is recursive, and so is almost every function you will write over it: a tree is either empty, or a node holding a value and two subtrees.",
        "That single sentence is why tree code is so short. Handle the empty case, do something with the node, recurse into both children, combine. Height, size, sum, mirror, depth, count-leaves — all the same skeleton with a different combine step.",
        "The vocabulary is worth pinning down because interviewers use it precisely. **Depth** of a node is its distance from the root; **height** of a node is its distance to the deepest leaf below it. The height of the tree is the height of its root. A **leaf** has no children; an **internal** node has at least one.",
        "The one to agree on out loud is the empty tree. Measured in **edges** — the common convention, and the one used here — a single node has height 0 and an empty tree has height −1. Measured in **nodes**, they are 1 and 0. Both appear in textbooks, so say which you mean before you write the base case.",
      ],
      examples: [
        {
          id: "shape-basics",
          title: "The same skeleton, three times",
          lang: "python",
          code: `class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

#        4
#      /   \\
#     2     7
#    / \\   /
#   1   3 6
root = Node(4, Node(2, Node(1), Node(3)), Node(7, Node(6)))

def height(node):
    """Edges on the longest downward path. An empty tree is -1."""
    if node is None:
        return -1
    return 1 + max(height(node.left), height(node.right))

def size(node):
    return 0 if node is None else 1 + size(node.left) + size(node.right)

def leaves(node):
    if node is None:
        return 0
    if node.left is None and node.right is None:
        return 1
    return leaves(node.left) + leaves(node.right)

print("height:", height(root))
print("size:  ", size(root))
print("leaves:", leaves(root))
print("height of a single node:", height(Node(1)))
print("height of an empty tree:", height(None))`,
          output: `height: 2
size:   6
leaves: 3
height of a single node: 0
height of an empty tree: -1`,
          explanation:
            "Three functions, one shape: base case for empty, then combine the two recursive results. `height` returns **−1** for empty precisely so that a leaf works out to 0 without a second base case — `1 + max(-1, -1)` is 0. Choosing −1 there is what removes the special case, and it is the kind of base-case choice worth being deliberate about. `leaves` needs its own second base case because a leaf is not the same as an empty child.",
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

//        4
//      /   \\
//     2     7
//    / \\   /
//   1   3 6
const root = new Node(4, new Node(2, new Node(1), new Node(3)), new Node(7, new Node(6)));

// Edges on the longest downward path. An empty tree is -1.
function height(node) {
  if (node === null) return -1;
  return 1 + Math.max(height(node.left), height(node.right));
}

function size(node) {
  return node === null ? 0 : 1 + size(node.left) + size(node.right);
}

function leaves(node) {
  if (node === null) return 0;
  if (node.left === null && node.right === null) return 1;
  return leaves(node.left) + leaves(node.right);
}

console.log("height:", height(root));
console.log("size:  ", size(root));
console.log("leaves:", leaves(root));
console.log("height of a single node:", height(new Node(1)));
console.log("height of an empty tree:", height(null));`,
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

//        4
//      /   \\
//     2     7
//    / \\   /
//   1   3 6
const root = new Node(4, new Node(2, new Node(1), new Node(3)), new Node(7, new Node(6)));

// Edges on the longest downward path. An empty tree is -1.
function height(node: Node | null): number {
  if (node === null) return -1;
  return 1 + Math.max(height(node.left), height(node.right));
}

function size(node: Node | null): number {
  return node === null ? 0 : 1 + size(node.left) + size(node.right);
}

function leaves(node: Node | null): number {
  if (node === null) return 0;
  if (node.left === null && node.right === null) return 1;
  return leaves(node.left) + leaves(node.right);
}

console.log("height:", height(root));
console.log("size:  ", size(root));
console.log("leaves:", leaves(root));
console.log("height of a single node:", height(new Node(1)));
console.log("height of an empty tree:", height(null));`,
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

    //        4
    //      /   \\
    //     2     7
    //    / \\   /
    //   1   3 6
    static final Node ROOT = new Node(4,
            new Node(2, new Node(1), new Node(3)),
            new Node(7, new Node(6), null));

    /** Edges on the longest downward path. An empty tree is -1. */
    static int height(Node node) {
        if (node == null) return -1;
        return 1 + Math.max(height(node.left), height(node.right));
    }

    static int size(Node node) {
        return node == null ? 0 : 1 + size(node.left) + size(node.right);
    }

    static int leaves(Node node) {
        if (node == null) return 0;
        if (node.left == null && node.right == null) return 1;
        return leaves(node.left) + leaves(node.right);
    }

    public static void main(String[] args) {
        System.out.println("height: " + height(ROOT));
        System.out.println("size:   " + size(ROOT));
        System.out.println("leaves: " + leaves(ROOT));
        System.out.println("height of a single node: " + height(new Node(1)));
        System.out.println("height of an empty tree: " + height(null));
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iostream>
using namespace std;

struct Node {
    int val;
    Node* left;
    Node* right;
    Node(int val, Node* left = nullptr, Node* right = nullptr)
        : val(val), left(left), right(right) {}
};

// Edges on the longest downward path. An empty tree is -1.
int height(Node* node) {
    if (!node) return -1;
    return 1 + max(height(node->left), height(node->right));
}

int size(Node* node) {
    return node ? 1 + size(node->left) + size(node->right) : 0;
}

int leaves(Node* node) {
    if (!node) return 0;
    if (!node->left && !node->right) return 1;
    return leaves(node->left) + leaves(node->right);
}

int main() {
    //        4
    //      /   \\
    //     2     7
    //    / \\   /
    //   1   3 6
    Node* root = new Node(4, new Node(2, new Node(1), new Node(3)),
                             new Node(7, new Node(6)));

    cout << "height: " << height(root) << "\\n";
    cout << "size:   " << size(root) << "\\n";
    cout << "leaves: " << leaves(root) << "\\n";
    cout << "height of a single node: " << height(new Node(1)) << "\\n";
    cout << "height of an empty tree: " << height(nullptr) << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `// \`Option<Box<Node>>\`: a tree node owns its children, and nothing here is
// shared or cyclic, so ownership lines up with the shape exactly.
struct Node {
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

/// Edges on the longest downward path. An empty tree is -1.
fn height(n: &Option<Box<Node>>) -> i32 {
    match n {
        None => -1,
        Some(node) => 1 + height(&node.left).max(height(&node.right)),
    }
}

fn size(n: &Option<Box<Node>>) -> i32 {
    match n {
        None => 0,
        Some(node) => 1 + size(&node.left) + size(&node.right),
    }
}

fn leaves(n: &Option<Box<Node>>) -> i32 {
    match n {
        None => 0,
        Some(node) if node.left.is_none() && node.right.is_none() => 1,
        Some(node) => leaves(&node.left) + leaves(&node.right),
    }
}

fn main() {
    //        4
    //      /   \\
    //     2     7
    //    / \\   /
    //   1   3 6
    let root = node(4, node(2, leaf(1), leaf(3)), node(7, leaf(6), None));

    println!("height: {}", height(&root));
    println!("size:   {}", size(&root));
    println!("leaves: {}", leaves(&root));
    println!("height of a single node: {}", height(&leaf(1)));
    println!("height of an empty tree: {}", height(&None));
}`,
            },
            {
              lang: "go",
              code: `package main

import "fmt"

type Node struct {
	val         int
	left, right *Node
}

// Edges on the longest downward path. An empty tree is -1.
func height(node *Node) int {
	if node == nil {
		return -1
	}
	return 1 + max(height(node.left), height(node.right))
}

func size(node *Node) int {
	if node == nil {
		return 0
	}
	return 1 + size(node.left) + size(node.right)
}

func leaves(node *Node) int {
	if node == nil {
		return 0
	}
	if node.left == nil && node.right == nil {
		return 1
	}
	return leaves(node.left) + leaves(node.right)
}

func main() {
	//        4
	//      /   \\
	//     2     7
	//    / \\   /
	//   1   3 6
	root := &Node{4,
		&Node{2, &Node{val: 1}, &Node{val: 3}},
		&Node{7, &Node{val: 6}, nil}}

	fmt.Println("height:", height(root))
	fmt.Println("size:  ", size(root))
	fmt.Println("leaves:", leaves(root))
	fmt.Println("height of a single node:", height(&Node{val: 1}))
	fmt.Println("height of an empty tree:", height(nil))
}`,
            },
          ],
        },
      ],
      visual: {
        id: "tree-shape",
        kind: "bst",
        title: "Nodes, children, and the height of each subtree",
      },
    },
    {
      id: "shape-decides",
      heading: "Shape decides the complexity",
      body: [
        "Every tree operation that descends from the root costs **O(height)**. Search, insert, delete, finding a minimum — all of them.",
        "So the whole performance story is the relationship between height and node count.",
        "A **balanced** tree of n nodes has height about log₂ n. A million nodes is twenty levels, so a search touches twenty nodes.",
        "A **degenerate** tree — every node with one child — has height n − 1. It is a linked list wearing a tree's type, and a search touches all million.",
        "The same code, the same data, a factor of fifty thousand apart. That gap is why balancing exists and why the next lessons spend so long on it.",
        "The subtlety worth carrying: the tree does not choose its shape, the **insertion order** does. Inserting sorted data into a plain BST produces exactly the degenerate case — which is the single most common way a BST goes wrong in practice.",
      ],
    },
    {
      id: "the-shapes",
      heading: "The named shapes",
      body: [
        "**Full** — every node has either zero or two children. No node has exactly one.",
        "**Complete** — every level is filled except possibly the last, which fills left to right. This is the shape a **heap** maintains, and it is what lets a heap live in an array with no pointers at all.",
        "**Perfect** — every level completely filled. A perfect tree of height h has exactly 2^(h+1) − 1 nodes, which is worth knowing because it gives you the log relationship directly.",
        "**Balanced** — the usual working definition is that the two subtrees of every node differ in height by at most one, which is AVL's rule. Red-black trees use a looser condition that still guarantees O(log n).",
        "These are not synonyms and interviewers do distinguish them. The one that earns its keep in practice is *complete*, because it is the heap's invariant and the reason `heap[2i+1]` addresses a child.",
      ],
      pitfalls: [
        {
          title: "Mixing the two height conventions",
          body: "Edges or nodes — a single node is height 0 or height 1 depending on which you pick. Both are used. State your convention before writing the base case, because an off-by-one here quietly breaks every depth comparison built on top of it.",
        },
        {
          title: "Forgetting the empty tree",
          body: "`root is None` is the first line of nearly every tree function, and it is the test case most often skipped. A recursion that assumes a node exists throws on the first empty child rather than at the top, which makes the stack trace point at the wrong place.",
        },
        {
          title: "Recursing without a depth budget",
          body: "A degenerate tree of a million nodes overflows the call stack. Python's default limit is 1000 frames, which a skewed tree of 1001 nodes exceeds. If depth is unbounded, use the explicit-stack traversal from the stacks module.",
        },
        {
          title: "Assuming a BST is balanced",
          body: "Nothing about the BST invariant implies balance. A plain BST built from sorted input is a linked list, and its O(log n) reputation is a property of balanced implementations only.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What is the height of a tree with one node?",
      answer:
        "Zero if you measure in edges, one if you measure in nodes. Say which convention you are using — the edge convention is more common in algorithm texts and makes an empty tree −1, which conveniently removes a base case from the height recursion.",
    },
    {
      question: "Why is a BST's complexity described as O(h) rather than O(log n)?",
      answer:
        "Because h is only log n when the tree is balanced. A BST built from sorted input degenerates into a linked list with h = n − 1, so every operation becomes O(n). O(h) is the honest bound; O(log n) is what balancing buys you.",
    },
    {
      question: "What is a complete binary tree and why does it matter?",
      answer:
        "Every level is full except possibly the last, which fills left to right. It matters because that shape can be stored in a flat array — children of index i live at 2i+1 and 2i+2 — with no pointers, which is exactly how a binary heap is implemented.",
    },
  ],
  takeaways: [
    "A tree is a node with subtrees, so the code is recursion with a base case",
    "Depth measures down from the root; height measures up from the leaves",
    "Height −1 for empty makes a leaf fall out as 0 with no extra case",
    "Every root-to-leaf operation costs O(height), not O(log n)",
    "Insertion order chooses the shape; sorted input gives a linked list",
    "Complete is the heap's shape and is why a heap needs no pointers",
  ],
  status: "available",
};
