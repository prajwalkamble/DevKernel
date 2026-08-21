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

const root = new Node(4, new Node(2, new Node(1), new Node(3)), new Node(7, new Node(6)));

function preorder(n, out) {
  if (n) {
    out.push(n.val);
    preorder(n.left, out);
    preorder(n.right, out);
  }
  return out;
}

function inorder(n, out) {
  if (n) {
    inorder(n.left, out);
    out.push(n.val);
    inorder(n.right, out);
  }
  return out;
}

function postorder(n, out) {
  if (n) {
    postorder(n.left, out);
    postorder(n.right, out);
    out.push(n.val);
  }
  return out;
}

function inorderIterative(root) {
  const out = [];
  const stack = [];
  let node = root;
  while (node || stack.length) {
    while (node) {                 // walk left, remembering the way back
      stack.push(node);
      node = node.left;
    }
    node = stack.pop();
    out.push(node.val);            // visit on the way up
    node = node.right;
  }
  return out;
}

console.log("preorder: ", list(preorder(root, [])));
console.log("inorder:  ", list(inorder(root, [])));
console.log("postorder:", list(postorder(root, [])));
console.log("iterative:", list(inorderIterative(root)));`,
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

const root = new Node(4, new Node(2, new Node(1), new Node(3)), new Node(7, new Node(6)));

function preorder(n: Node | null, out: number[]): number[] {
  if (n) {
    out.push(n.val);
    preorder(n.left, out);
    preorder(n.right, out);
  }
  return out;
}

function inorder(n: Node | null, out: number[]): number[] {
  if (n) {
    inorder(n.left, out);
    out.push(n.val);
    inorder(n.right, out);
  }
  return out;
}

function postorder(n: Node | null, out: number[]): number[] {
  if (n) {
    postorder(n.left, out);
    postorder(n.right, out);
    out.push(n.val);
  }
  return out;
}

function inorderIterative(root: Node | null): number[] {
  const out: number[] = [];
  const stack: Node[] = [];
  let node: Node | null = root;
  while (node || stack.length) {
    while (node) {                 // walk left, remembering the way back
      stack.push(node);
      node = node.left;
    }
    node = stack.pop()!;
    out.push(node.val);            // visit on the way up
    node = node.right;
  }
  return out;
}

console.log("preorder: ", list(preorder(root, [])));
console.log("inorder:  ", list(inorder(root, [])));
console.log("postorder:", list(postorder(root, [])));
console.log("iterative:", list(inorderIterative(root)));`,
            },
            {
              lang: "java",
              code: `import java.util.*;

public class Main {
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

    static String list(List<Integer> xs) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < xs.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(xs.get(i));
        }
        return sb.append("]").toString();
    }

    static List<Integer> preorder(Node n, List<Integer> out) {
        if (n != null) {
            out.add(n.val);
            preorder(n.left, out);
            preorder(n.right, out);
        }
        return out;
    }

    static List<Integer> inorder(Node n, List<Integer> out) {
        if (n != null) {
            inorder(n.left, out);
            out.add(n.val);
            inorder(n.right, out);
        }
        return out;
    }

    static List<Integer> postorder(Node n, List<Integer> out) {
        if (n != null) {
            postorder(n.left, out);
            postorder(n.right, out);
            out.add(n.val);
        }
        return out;
    }

    static List<Integer> inorderIterative(Node root) {
        List<Integer> out = new ArrayList<>();
        Deque<Node> stack = new ArrayDeque<>();
        Node node = root;
        while (node != null || !stack.isEmpty()) {
            while (node != null) {       // walk left, remembering the way back
                stack.push(node);
                node = node.left;
            }
            node = stack.pop();
            out.add(node.val);           // visit on the way up
            node = node.right;
        }
        return out;
    }

    public static void main(String[] args) {
        Node root = new Node(4, new Node(2, new Node(1), new Node(3)),
                                new Node(7, new Node(6), null));
        System.out.println("preorder:  " + list(preorder(root, new ArrayList<>())));
        System.out.println("inorder:   " + list(inorder(root, new ArrayList<>())));
        System.out.println("postorder: " + list(postorder(root, new ArrayList<>())));
        System.out.println("iterative: " + list(inorderIterative(root)));
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <stack>
#include <string>
#include <vector>
using namespace std;

struct Node {
    int val;
    Node* left;
    Node* right;
    Node(int val, Node* left = nullptr, Node* right = nullptr)
        : val(val), left(left), right(right) {}
};

string list(const vector<int>& xs) {
    string out = "[";
    for (size_t i = 0; i < xs.size(); i++) {
        if (i) out += ", ";
        out += to_string(xs[i]);
    }
    return out + "]";
}

vector<int>& preorder(Node* n, vector<int>& out) {
    if (n) {
        out.push_back(n->val);
        preorder(n->left, out);
        preorder(n->right, out);
    }
    return out;
}

vector<int>& inorder(Node* n, vector<int>& out) {
    if (n) {
        inorder(n->left, out);
        out.push_back(n->val);
        inorder(n->right, out);
    }
    return out;
}

vector<int>& postorder(Node* n, vector<int>& out) {
    if (n) {
        postorder(n->left, out);
        postorder(n->right, out);
        out.push_back(n->val);
    }
    return out;
}

vector<int> inorderIterative(Node* root) {
    vector<int> out;
    stack<Node*> st;
    Node* node = root;
    while (node || !st.empty()) {
        while (node) {              // walk left, remembering the way back
            st.push(node);
            node = node->left;
        }
        node = st.top();
        st.pop();
        out.push_back(node->val);   // visit on the way up
        node = node->right;
    }
    return out;
}

int main() {
    Node* root = new Node(4, new Node(2, new Node(1), new Node(3)),
                             new Node(7, new Node(6)));
    vector<int> a, b, c;
    cout << "preorder:  " << list(preorder(root, a)) << "\\n";
    cout << "inorder:   " << list(inorder(root, b)) << "\\n";
    cout << "postorder: " << list(postorder(root, c)) << "\\n";
    cout << "iterative: " << list(inorderIterative(root)) << "\\n";
}`,
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

fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn preorder(n: &Option<Box<Node>>, out: &mut Vec<i32>) {
    if let Some(node) = n {
        out.push(node.val);
        preorder(&node.left, out);
        preorder(&node.right, out);
    }
}

fn inorder(n: &Option<Box<Node>>, out: &mut Vec<i32>) {
    if let Some(node) = n {
        inorder(&node.left, out);
        out.push(node.val);
        inorder(&node.right, out);
    }
}

fn postorder(n: &Option<Box<Node>>, out: &mut Vec<i32>) {
    if let Some(node) = n {
        postorder(&node.left, out);
        postorder(&node.right, out);
        out.push(node.val);
    }
}

fn inorder_iterative(root: &Option<Box<Node>>) -> Vec<i32> {
    let mut out = Vec::new();
    let mut stack: Vec<&Node> = Vec::new();
    let mut cur = root.as_deref();
    while cur.is_some() || !stack.is_empty() {
        while let Some(n) = cur {
            // walk left, remembering the way back
            stack.push(n);
            cur = n.left.as_deref();
        }
        let n = stack.pop().unwrap();
        out.push(n.val); // visit on the way up
        cur = n.right.as_deref();
    }
    out
}

fn main() {
    let root = node(4, node(2, leaf(1), leaf(3)), node(7, leaf(6), None));

    let (mut a, mut b, mut c) = (Vec::new(), Vec::new(), Vec::new());
    preorder(&root, &mut a);
    inorder(&root, &mut b);
    postorder(&root, &mut c);
    println!("preorder:  {}", list(&a));
    println!("inorder:   {}", list(&b));
    println!("postorder: {}", list(&c));
    println!("iterative: {}", list(&inorder_iterative(&root)));
}`,
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

func preorder(n *Node, out []int) []int {
	if n != nil {
		out = append(out, n.val)
		out = preorder(n.left, out)
		out = preorder(n.right, out)
	}
	return out
}

func inorder(n *Node, out []int) []int {
	if n != nil {
		out = inorder(n.left, out)
		out = append(out, n.val)
		out = inorder(n.right, out)
	}
	return out
}

func postorder(n *Node, out []int) []int {
	if n != nil {
		out = postorder(n.left, out)
		out = postorder(n.right, out)
		out = append(out, n.val)
	}
	return out
}

func inorderIterative(root *Node) []int {
	var out []int
	var stack []*Node
	node := root
	for node != nil || len(stack) > 0 {
		for node != nil { // walk left, remembering the way back
			stack = append(stack, node)
			node = node.left
		}
		node = stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		out = append(out, node.val) // visit on the way up
		node = node.right
	}
	return out
}

func main() {
	root := &Node{4,
		&Node{2, &Node{val: 1}, &Node{val: 3}},
		&Node{7, &Node{val: 6}, nil}}

	fmt.Println("preorder: ", list(preorder(root, nil)))
	fmt.Println("inorder:  ", list(inorder(root, nil)))
	fmt.Println("postorder:", list(postorder(root, nil)))
	fmt.Println("iterative:", list(inorderIterative(root)))
}`,
            },
          ],
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
