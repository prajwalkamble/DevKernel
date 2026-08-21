import type { Lesson } from "@/content/types";

export const bstInvariantLesson: Lesson = {
  id: "dsa-tree-bst",
  slug: "the-bst-invariant",
  moduleSlug: "trees",
  title: "The BST Invariant",
  summary:
    "One ordering rule turns a tree into a searchable structure: everything left is smaller, everything right is larger. Search and insert follow immediately. Delete is the one with a genuine complication.",
  estimatedMinutes: 35,
  objectives: [
    "State the invariant precisely, including the subtree quantifier",
    "Implement search and insert iteratively and recursively",
    "Handle all three deletion cases",
    "Explain why insertion order decides the tree's shape",
  ],
  sections: [
    {
      id: "the-rule",
      heading: "The rule, stated carefully",
      body: [
        "For every node: **every value in its left subtree is smaller, and every value in its right subtree is larger**.",
        "The quantifier is the part people get wrong. It is not \"the left child is smaller\" — it is every node in the entire left subtree. That distinction is the whole content of the next lesson, and it is the difference between a validation that works and one that passes on invalid trees.",
        "From the rule, searching writes itself. At each node, the value you want is either here, or entirely in one subtree — so discard the other and descend. Each step halves the remaining tree *if it is balanced*, giving O(h).",
        "Insertion is search that ran out of tree: descend as if searching, and when you fall off the bottom, that is where the new node belongs. It is the only position that keeps the invariant.",
      ],
      examples: [
        {
          id: "bst-basics",
          title: "Insert, search, and what insertion order does",
          lang: "python",
          code: `class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def insert(node, val):
    if node is None:
        return Node(val)
    if val < node.val:
        node.left = insert(node.left, val)
    elif val > node.val:
        node.right = insert(node.right, val)
    return node                      # equal values are ignored here

def search(node, val):
    while node:
        if val == node.val: return True
        node = node.left if val < node.val else node.right
    return False

def inorder(n, out):
    if n:
        inorder(n.left, out); out.append(n.val); inorder(n.right, out)
    return out

root = None
for v in [8, 3, 10, 1, 6, 14, 4, 7]:
    root = insert(root, v)

print("inorder:", inorder(root, []))
print("search 6: ", search(root, 6))
print("search 5: ", search(root, 5))

# A sorted insertion order gives a tree that is a linked list.
degenerate = None
for v in [1, 2, 3, 4, 5]:
    degenerate = insert(degenerate, v)

def height(n):
    return -1 if n is None else 1 + max(height(n.left), height(n.right))

print("balanced-ish height:", height(root))
print("degenerate height:  ", height(degenerate))`,
          output: `inorder: [1, 3, 4, 6, 7, 8, 10, 14]
search 6:  True
search 5:  False
balanced-ish height: 3
degenerate height:   4`,
          explanation:
            "In-order comes out sorted, which is the invariant made visible. The last two lines are the point of the lesson: **eight scattered values give height 3; five sorted values give height 4**. The degenerate tree has fewer nodes and is taller, because each insert went right every time — it is a linked list. Nothing in the insert code is wrong; the input chose the shape. `insert` returns the (possibly new) subtree root and the caller reassigns, which is the idiom that avoids needing a parent pointer.",
          alternates: [
            {
              lang: "javascript",
              code: `const list = (xs) => "[" + xs.join(", ") + "]";

class Node {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function insert(node, val) {
  if (node === null) return new Node(val);
  if (val < node.val) node.left = insert(node.left, val);
  else if (val > node.val) node.right = insert(node.right, val);
  return node;                     // equal values are ignored here
}

function search(node, val) {
  while (node) {
    if (val === node.val) return true;
    node = val < node.val ? node.left : node.right;
  }
  return false;
}

function inorder(n, out) {
  if (n) {
    inorder(n.left, out);
    out.push(n.val);
    inorder(n.right, out);
  }
  return out;
}

let root = null;
for (const v of [8, 3, 10, 1, 6, 14, 4, 7]) root = insert(root, v);

console.log("inorder:", list(inorder(root, [])));
console.log("search 6: ", search(root, 6));
console.log("search 5: ", search(root, 5));

// A sorted insertion order gives a tree that is a linked list.
let degenerate = null;
for (const v of [1, 2, 3, 4, 5]) degenerate = insert(degenerate, v);

function height(n) {
  return n === null ? -1 : 1 + Math.max(height(n.left), height(n.right));
}

console.log("balanced-ish height:", height(root));
console.log("degenerate height:  ", height(degenerate));`,
              output: `inorder: [1, 3, 4, 6, 7, 8, 10, 14]
search 6:  true
search 5:  false
balanced-ish height: 3
degenerate height:   4`,
            },
            {
              lang: "typescript",
              code: `const list = (xs: number[]): string => "[" + xs.join(", ") + "]";

class Node {
  val: number;
  left: Node | null;
  right: Node | null;

  constructor(val: number, left: Node | null = null, right: Node | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function insert(node: Node | null, val: number): Node {
  if (node === null) return new Node(val);
  if (val < node.val) node.left = insert(node.left, val);
  else if (val > node.val) node.right = insert(node.right, val);
  return node;                     // equal values are ignored here
}

function search(node: Node | null, val: number): boolean {
  while (node) {
    if (val === node.val) return true;
    node = val < node.val ? node.left : node.right;
  }
  return false;
}

function inorder(n: Node | null, out: number[]): number[] {
  if (n) {
    inorder(n.left, out);
    out.push(n.val);
    inorder(n.right, out);
  }
  return out;
}

let root: Node | null = null;
for (const v of [8, 3, 10, 1, 6, 14, 4, 7]) root = insert(root, v);

console.log("inorder:", list(inorder(root, [])));
console.log("search 6: ", search(root, 6));
console.log("search 5: ", search(root, 5));

// A sorted insertion order gives a tree that is a linked list.
let degenerate: Node | null = null;
for (const v of [1, 2, 3, 4, 5]) degenerate = insert(degenerate, v);

function height(n: Node | null): number {
  return n === null ? -1 : 1 + Math.max(height(n.left), height(n.right));
}

console.log("balanced-ish height:", height(root));
console.log("degenerate height:  ", height(degenerate));`,
              output: `inorder: [1, 3, 4, 6, 7, 8, 10, 14]
search 6:  true
search 5:  false
balanced-ish height: 3
degenerate height:   4`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
    static class Node {
        int val;
        Node left, right;

        Node(int val) { this.val = val; }
    }

    static String list(List<Integer> xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs.get(i));
        }
        return sb.append("]").toString();
    }

    static Node insert(Node node, int val) {
        if (node == null) return new Node(val);
        if (val < node.val) node.left = insert(node.left, val);
        else if (val > node.val) node.right = insert(node.right, val);
        return node;                 // equal values are ignored here
    }

    static boolean search(Node node, int val) {
        while (node != null) {
            if (val == node.val) return true;
            node = val < node.val ? node.left : node.right;
        }
        return false;
    }

    static List<Integer> inorder(Node n, List<Integer> out) {
        if (n != null) {
            inorder(n.left, out);
            out.add(n.val);
            inorder(n.right, out);
        }
        return out;
    }

    static int height(Node n) {
        return n == null ? -1 : 1 + Math.max(height(n.left), height(n.right));
    }

    public static void main(String[] args) {
        Node root = null;
        for (int v : new int[]{8, 3, 10, 1, 6, 14, 4, 7}) root = insert(root, v);

        System.out.println("inorder: " + list(inorder(root, new ArrayList<>())));
        System.out.println("search 6:  " + search(root, 6));
        System.out.println("search 5:  " + search(root, 5));

        // A sorted insertion order gives a tree that is a linked list.
        Node degenerate = null;
        for (int v : new int[]{1, 2, 3, 4, 5}) degenerate = insert(degenerate, v);

        System.out.println("balanced-ish height: " + height(root));
        System.out.println("degenerate height:   " + height(degenerate));
    }
}`,
              output: `inorder: [1, 3, 4, 6, 7, 8, 10, 14]
search 6:  true
search 5:  false
balanced-ish height: 3
degenerate height:   4`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Node {
    int val;
    Node* left = nullptr;
    Node* right = nullptr;
    explicit Node(int val) : val(val) {}
};

string list(const vector<int>& xs) {
    string out = "[";
    for (size_t i = 0; i < xs.size(); i++) {
        if (i) out += ", ";
        out += to_string(xs[i]);
    }
    return out + "]";
}

Node* insert(Node* node, int val) {
    if (!node) return new Node(val);
    if (val < node->val) node->left = insert(node->left, val);
    else if (val > node->val) node->right = insert(node->right, val);
    return node;                     // equal values are ignored here
}

bool search(Node* node, int val) {
    while (node) {
        if (val == node->val) return true;
        node = val < node->val ? node->left : node->right;
    }
    return false;
}

vector<int>& inorder(Node* n, vector<int>& out) {
    if (n) {
        inorder(n->left, out);
        out.push_back(n->val);
        inorder(n->right, out);
    }
    return out;
}

int height(Node* n) {
    return n ? 1 + max(height(n->left), height(n->right)) : -1;
}

int main() {
    Node* root = nullptr;
    for (int v : {8, 3, 10, 1, 6, 14, 4, 7}) root = insert(root, v);

    vector<int> walk;
    cout << "inorder: " << list(inorder(root, walk)) << "\\n";
    cout << "search 6:  " << boolalpha << search(root, 6) << "\\n";
    cout << "search 5:  " << boolalpha << search(root, 5) << "\\n";

    // A sorted insertion order gives a tree that is a linked list.
    Node* degenerate = nullptr;
    for (int v : {1, 2, 3, 4, 5}) degenerate = insert(degenerate, v);

    cout << "balanced-ish height: " << height(root) << "\\n";
    cout << "degenerate height:   " << height(degenerate) << "\\n";
}`,
              output: `inorder: [1, 3, 4, 6, 7, 8, 10, 14]
search 6:  true
search 5:  false
balanced-ish height: 3
degenerate height:   4`,
            },
            {
              lang: "rust",
              code: `struct Node {
    val: i32,
    left: Option<Box<Node>>,
    right: Option<Box<Node>>,
}

fn leaf(val: i32) -> Option<Box<Node>> {
    Some(Box::new(Node { val, left: None, right: None }))
}

fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn insert(node: Option<Box<Node>>, val: i32) -> Option<Box<Node>> {
    match node {
        None => leaf(val),
        Some(mut n) => {
            if val < n.val {
                n.left = insert(n.left.take(), val);
            } else if val > n.val {
                n.right = insert(n.right.take(), val);
            }
            Some(n) // equal values are ignored here
        }
    }
}

fn search(root: &Option<Box<Node>>, val: i32) -> bool {
    let mut cur = root.as_deref();
    while let Some(n) = cur {
        if val == n.val {
            return true;
        }
        cur = if val < n.val { n.left.as_deref() } else { n.right.as_deref() };
    }
    false
}

fn inorder(n: &Option<Box<Node>>, out: &mut Vec<i32>) {
    if let Some(node) = n {
        inorder(&node.left, out);
        out.push(node.val);
        inorder(&node.right, out);
    }
}

fn height(n: &Option<Box<Node>>) -> i32 {
    match n {
        None => -1,
        Some(node) => 1 + height(&node.left).max(height(&node.right)),
    }
}

fn main() {
    let mut root = None;
    for v in [8, 3, 10, 1, 6, 14, 4, 7] {
        root = insert(root, v);
    }

    let mut walk = Vec::new();
    inorder(&root, &mut walk);
    println!("inorder: {}", list(&walk));
    println!("search 6:  {}", search(&root, 6));
    println!("search 5:  {}", search(&root, 5));

    // A sorted insertion order gives a tree that is a linked list.
    let mut degenerate = None;
    for v in [1, 2, 3, 4, 5] {
        degenerate = insert(degenerate, v);
    }

    println!("balanced-ish height: {}", height(&root));
    println!("degenerate height:   {}", height(&degenerate));
}`,
              output: `inorder: [1, 3, 4, 6, 7, 8, 10, 14]
search 6:  true
search 5:  false
balanced-ish height: 3
degenerate height:   4`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strings"
)

type Node struct {
	val         int
	left, right *Node
}

func list(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = fmt.Sprint(x)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func insert(node *Node, val int) *Node {
	if node == nil {
		return &Node{val: val}
	}
	if val < node.val {
		node.left = insert(node.left, val)
	} else if val > node.val {
		node.right = insert(node.right, val)
	}
	return node // equal values are ignored here
}

func search(node *Node, val int) bool {
	for node != nil {
		if val == node.val {
			return true
		}
		if val < node.val {
			node = node.left
		} else {
			node = node.right
		}
	}
	return false
}

func inorder(n *Node, out []int) []int {
	if n != nil {
		out = inorder(n.left, out)
		out = append(out, n.val)
		out = inorder(n.right, out)
	}
	return out
}

func height(n *Node) int {
	if n == nil {
		return -1
	}
	return 1 + max(height(n.left), height(n.right))
}

func main() {
	var root *Node
	for _, v := range []int{8, 3, 10, 1, 6, 14, 4, 7} {
		root = insert(root, v)
	}

	fmt.Println("inorder:", list(inorder(root, nil)))
	fmt.Println("search 6: ", search(root, 6))
	fmt.Println("search 5: ", search(root, 5))

	// A sorted insertion order gives a tree that is a linked list.
	var degenerate *Node
	for _, v := range []int{1, 2, 3, 4, 5} {
		degenerate = insert(degenerate, v)
	}

	fmt.Println("balanced-ish height:", height(root))
	fmt.Println("degenerate height:  ", height(degenerate))
}`,
              output: `inorder: [1, 3, 4, 6, 7, 8, 10, 14]
search 6:  true
search 5:  false
balanced-ish height: 3
degenerate height:   4`,
            },
          ],
        },
      ],
      visual: {
        id: "bst-insert",
        kind: "bst",
        title: "Each insert descends until it falls off the tree",
      },
    },
    {
      id: "deletion",
      heading: "Deletion, and its three cases",
      body: [
        "Deletion is the only BST operation with real structure to it, because removing a node leaves a hole that has to be filled without breaking the ordering.",
        "**No children.** Detach it. Nothing else changes.",
        "**One child.** Splice the child up into the node's place. The subtree was already correctly ordered relative to everything above, so moving it up preserves the invariant.",
        "**Two children.** The interesting one. The node's replacement must be greater than everything on its left and smaller than everything on its right — and exactly two values qualify: the **in-order predecessor** (the largest value in the left subtree) and the **in-order successor** (the smallest in the right).",
        "Convention picks the successor: walk right once, then left as far as possible. Copy its value into the node being deleted, then delete *that* node from the right subtree — which is guaranteed to be an easier case, because the leftmost node has no left child by construction.",
        "That recursion-into-a-simpler-case is what makes deletion tractable, and being able to say \"the successor has at most one child, so the second delete is case one or two\" is what an interviewer is listening for.",
      ],
      visual: {
        id: "bst-delete",
        kind: "tree-algorithm",
        algorithm: "bstdelete",
        lockAlgorithm: true,
        title: "Deleting a node with two children, via its successor",
      },
      pitfalls: [
        {
          title: "Not reassigning the returned subtree",
          body: "`insert(node.left, val)` without `node.left =` builds a new subtree and throws it away. The recursive form works by returning the subtree root and having the parent reassign it; forgetting that produces a tree where only the first insert took effect.",
        },
        {
          title: "Deciding duplicates by accident",
          body: "Equal values must go consistently left, consistently right, or be counted on the node. The code above ignores them, which is a choice. Whatever you pick, search and delete must agree with insert — a mismatch makes some values unreachable.",
        },
        {
          title: "Picking the wrong replacement on delete",
          body: "Only the in-order predecessor or successor preserve the ordering. Any other node from either subtree breaks the invariant for some value. Say which one you are using and why.",
        },
        {
          title: "Assuming O(log n)",
          body: "Every operation here is O(h). Without balancing, h can be n. A plain BST fed sorted data is the worst case, and it is also the most likely input in practice.",
        },
      ],
    },
    {
      id: "in-practice",
      heading: "What you actually use",
      body: [
        "You will almost never implement a BST in production. What you use is the balanced implementation your language ships: `TreeMap` and `TreeSet` in Java, `std::map` and `std::set` in C++, `BTreeMap` in Rust, `SortedDict` in Python via `sortedcontainers`. Go has none in the standard library, which is why sorted slices plus binary search are idiomatic there.",
        "What those give you over a hash map is **order**: floor and ceiling queries, range scans, iterate-in-sorted-order, and first/last. That is the trade the hashing module ended on, and it is the practical reason to know the structure at all.",
        "The other reason is that BST logic shows up inside problems that have nothing to do with storage — validating, reconstructing, converting to and from sorted arrays, or answering range queries over a tree that was handed to you.",
        "So the working knowledge is: the invariant, in-order gives sorted, operations are O(h), and h is only log n if something is maintaining balance. The next lesson is about how easy it is to get the first of those subtly wrong.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "State the BST invariant.",
      answer:
        "For every node, all values in its left subtree are smaller and all values in its right subtree are larger. The quantifier is over the whole subtree, not just the immediate children — that is what makes validation a range problem rather than a local comparison.",
    },
    {
      question: "How do you delete a node with two children?",
      answer:
        "Replace it with its in-order successor — the smallest value in the right subtree, found by going right once then left as far as possible — then delete that successor from the right subtree. The successor has no left child by construction, so the second deletion is the zero- or one-child case.",
    },
    {
      question: "Why can a BST be O(n) per operation?",
      answer:
        "Every operation costs O(height), and nothing in the invariant constrains the height. Inserting sorted data makes each new value go right every time, producing a linked list of height n − 1. Balanced variants exist precisely to bound the height at O(log n).",
    },
  ],
  takeaways: [
    "The invariant quantifies over whole subtrees, not immediate children",
    "Search descends by discarding one side; insert is search that ran out of tree",
    "Return the subtree root and let the parent reassign it",
    "Deletion with two children uses the in-order successor",
    "The successor has no left child, so the recursive delete is an easy case",
    "Insertion order decides shape; sorted input gives a linked list",
  ],
  status: "available",
};
