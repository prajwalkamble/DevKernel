import type { Lesson } from "@/content/types";

export const serialiseAndSheetLesson: Lesson = {
  id: "dsa-tree-serialise",
  slug: "serialising-and-the-sheet",
  moduleSlug: "trees",
  title: "Serialising, Reconstructing, and the Sheet",
  summary:
    "Turning a tree into a string and back is the problem that forces you to be precise about what a traversal actually records — and it explains why in-order alone can never rebuild a tree.",
  estimatedMinutes: 30,
  objectives: [
    "Serialise and deserialise with an explicit null marker",
    "Explain why two traversals are needed to rebuild without markers",
    "Say why in-order plus post-order works but in-order alone does not",
    "Recall the standard problems and the move each drills",
  ],
  sections: [
    {
      id: "with-markers",
      heading: "Pre-order with null markers",
      body: [
        "A pre-order traversal that records absent children explicitly is enough to rebuild a tree exactly, and it is the cleanest answer to the serialise question.",
        "Serialising: visit the node, emit its value, recurse left, recurse right — emitting a marker whenever the node is null.",
        "Deserialising is the mirror, consuming tokens in the same order: read a token; if it is the marker, return null; otherwise make a node, then build its left subtree from the following tokens, then its right.",
        "The reason it works is that pre-order emits a node **before** its subtrees, so the reader always knows it is about to receive a left subtree and then a right one. The markers supply the missing information about where each subtree stops.",
      ],
      examples: [
        {
          id: "serialise",
          title: "Round trip",
          lang: "python",
          code: `class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

root = Node(1, Node(2), Node(3, Node(4), Node(5)))

def serialise(node):
    """Preorder, with an explicit marker for absent children."""
    out = []
    def walk(n):
        if n is None:
            out.append("#")
            return
        out.append(str(n.val))
        walk(n.left)
        walk(n.right)
    walk(node)
    return ",".join(out)

def deserialise(text):
    tokens = iter(text.split(","))
    def build():
        token = next(tokens)
        if token == "#":
            return None
        node = Node(int(token))
        node.left = build()
        node.right = build()
        return node
    return build()

def inorder(n, out):
    if n:
        inorder(n.left, out); out.append(n.val); inorder(n.right, out)
    return out

text = serialise(root)
print("serialised:", text)
rebuilt = deserialise(text)
print("inorder of original:", inorder(root, []))
print("inorder of rebuilt: ", inorder(rebuilt, []))
print("round trip matches: ", serialise(rebuilt) == text)
print("empty tree:", serialise(None))`,
          output: `serialised: 1,2,#,#,3,4,#,#,5,#,#
inorder of original: [2, 1, 4, 3, 5]
inorder of rebuilt:  [2, 1, 4, 3, 5]
round trip matches:  True
empty tree: #`,
          explanation:
            "The two assignments in `build` must stay in that order — left then right — because they consume from a shared iterator and the order of consumption *is* the structure. Writing them as a single constructor call would leave evaluation order to the language and is a genuine portability bug. Using an iterator rather than an index is what keeps the position shared across recursive calls without passing it explicitly; an index passed by value would reset on each return.",
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

const root = new Node(1, new Node(2), new Node(3, new Node(4), new Node(5)));

// Preorder, with an explicit marker for absent children.
function serialise(node) {
  const out = [];
  function walk(n) {
    if (n === null) {
      out.push("#");
      return;
    }
    out.push(String(n.val));
    walk(n.left);
    walk(n.right);
  }
  walk(node);
  return out.join(",");
}

function deserialise(text) {
  const tokens = text.split(",");
  let i = 0;
  function build() {
    const token = tokens[i++];
    if (token === "#") return null;
    const node = new Node(Number(token));
    node.left = build();
    node.right = build();
    return node;
  }
  return build();
}

function inorder(n, out) {
  if (n) {
    inorder(n.left, out);
    out.push(n.val);
    inorder(n.right, out);
  }
  return out;
}

const text = serialise(root);
console.log("serialised:", text);
const rebuilt = deserialise(text);
console.log("inorder of original:", list(inorder(root, [])));
console.log("inorder of rebuilt: ", list(inorder(rebuilt, [])));
console.log("round trip matches: ", serialise(rebuilt) === text);
console.log("empty tree:", serialise(null));`,
              output: `serialised: 1,2,#,#,3,4,#,#,5,#,#
inorder of original: [2, 1, 4, 3, 5]
inorder of rebuilt:  [2, 1, 4, 3, 5]
round trip matches:  true
empty tree: #`,
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

const root = new Node(1, new Node(2), new Node(3, new Node(4), new Node(5)));

// Preorder, with an explicit marker for absent children.
function serialise(node: Node | null): string {
  const out: string[] = [];
  function walk(n: Node | null): void {
    if (n === null) {
      out.push("#");
      return;
    }
    out.push(String(n.val));
    walk(n.left);
    walk(n.right);
  }
  walk(node);
  return out.join(",");
}

function deserialise(text: string): Node | null {
  const tokens = text.split(",");
  let i = 0;
  function build(): Node | null {
    const token = tokens[i++];
    if (token === "#") return null;
    const node = new Node(Number(token));
    node.left = build();
    node.right = build();
    return node;
  }
  return build();
}

function inorder(n: Node | null, out: number[]): number[] {
  if (n) {
    inorder(n.left, out);
    out.push(n.val);
    inorder(n.right, out);
  }
  return out;
}

const text = serialise(root);
console.log("serialised:", text);
const rebuilt = deserialise(text);
console.log("inorder of original:", list(inorder(root, [])));
console.log("inorder of rebuilt: ", list(inorder(rebuilt, [])));
console.log("round trip matches: ", serialise(rebuilt) === text);
console.log("empty tree:", serialise(null));`,
              output: `serialised: 1,2,#,#,3,4,#,#,5,#,#
inorder of original: [2, 1, 4, 3, 5]
inorder of rebuilt:  [2, 1, 4, 3, 5]
round trip matches:  true
empty tree: #`,
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

    /** Preorder, with an explicit marker for absent children. */
    static String serialise(Node node) {
        List<String> out = new ArrayList<>();
        walk(node, out);
        return String.join(",", out);
    }

    static void walk(Node n, List<String> out) {
        if (n == null) {
            out.add("#");
            return;
        }
        out.add(String.valueOf(n.val));
        walk(n.left, out);
        walk(n.right, out);
    }

    static int cursor;

    static Node deserialise(String text) {
        String[] tokens = text.split(",");
        cursor = 0;
        return build(tokens);
    }

    static Node build(String[] tokens) {
        String token = tokens[cursor++];
        if (token.equals("#")) return null;
        Node node = new Node(Integer.parseInt(token));
        node.left = build(tokens);
        node.right = build(tokens);
        return node;
    }

    static List<Integer> inorder(Node n, List<Integer> out) {
        if (n != null) {
            inorder(n.left, out);
            out.add(n.val);
            inorder(n.right, out);
        }
        return out;
    }

    public static void main(String[] args) {
        Node root = new Node(1, new Node(2), new Node(3, new Node(4), new Node(5)));

        String text = serialise(root);
        System.out.println("serialised: " + text);
        Node rebuilt = deserialise(text);
        System.out.println("inorder of original: " + list(inorder(root, new ArrayList<>())));
        System.out.println("inorder of rebuilt:  " + list(inorder(rebuilt, new ArrayList<>())));
        System.out.println("round trip matches:  " + serialise(rebuilt).equals(text));
        System.out.println("empty tree: " + serialise(null));
    }
}`,
              output: `serialised: 1,2,#,#,3,4,#,#,5,#,#
inorder of original: [2, 1, 4, 3, 5]
inorder of rebuilt:  [2, 1, 4, 3, 5]
round trip matches:  true
empty tree: #`,
            },
            {
              lang: "cpp",
              code: `#include <iostream>
#include <sstream>
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

// Preorder, with an explicit marker for absent children.
void walk(Node* n, vector<string>& out) {
    if (!n) {
        out.push_back("#");
        return;
    }
    out.push_back(to_string(n->val));
    walk(n->left, out);
    walk(n->right, out);
}

string serialise(Node* node) {
    vector<string> out;
    walk(node, out);
    string joined;
    for (size_t i = 0; i < out.size(); i++) {
        if (i) joined += ",";
        joined += out[i];
    }
    return joined;
}

Node* build(const vector<string>& tokens, size_t& cursor) {
    string token = tokens[cursor++];
    if (token == "#") return nullptr;
    Node* node = new Node(stoi(token));
    node->left = build(tokens, cursor);
    node->right = build(tokens, cursor);
    return node;
}

Node* deserialise(const string& text) {
    vector<string> tokens;
    stringstream ss(text);
    string part;
    while (getline(ss, part, ',')) tokens.push_back(part);
    size_t cursor = 0;
    return build(tokens, cursor);
}

vector<int>& inorder(Node* n, vector<int>& out) {
    if (n) {
        inorder(n->left, out);
        out.push_back(n->val);
        inorder(n->right, out);
    }
    return out;
}

int main() {
    Node* root = new Node(1, new Node(2), new Node(3, new Node(4), new Node(5)));

    string text = serialise(root);
    cout << "serialised: " << text << "\\n";
    Node* rebuilt = deserialise(text);
    vector<int> a, b;
    cout << "inorder of original: " << list(inorder(root, a)) << "\\n";
    cout << "inorder of rebuilt:  " << list(inorder(rebuilt, b)) << "\\n";
    cout << "round trip matches:  " << boolalpha << (serialise(rebuilt) == text) << "\\n";
    cout << "empty tree: " << serialise(nullptr) << "\\n";
}`,
              output: `serialised: 1,2,#,#,3,4,#,#,5,#,#
inorder of original: [2, 1, 4, 3, 5]
inorder of rebuilt:  [2, 1, 4, 3, 5]
round trip matches:  true
empty tree: #`,
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

/// Preorder, with an explicit marker for absent children.
fn walk(n: &Option<Box<Node>>, out: &mut Vec<String>) {
    match n {
        None => out.push("#".to_string()),
        Some(node) => {
            out.push(node.val.to_string());
            walk(&node.left, out);
            walk(&node.right, out);
        }
    }
}

fn serialise(n: &Option<Box<Node>>) -> String {
    let mut out = Vec::new();
    walk(n, &mut out);
    out.join(",")
}

fn build(tokens: &[&str], cursor: &mut usize) -> Option<Box<Node>> {
    let token = tokens[*cursor];
    *cursor += 1;
    if token == "#" {
        return None;
    }
    let mut n = Box::new(Node {
        val: token.parse().unwrap(),
        left: None,
        right: None,
    });
    // Left before right, and both before the node is handed back: the cursor
    // is shared, so the order of these two lines is the tree's shape.
    n.left = build(tokens, cursor);
    n.right = build(tokens, cursor);
    Some(n)
}

fn deserialise(text: &str) -> Option<Box<Node>> {
    let tokens: Vec<&str> = text.split(',').collect();
    let mut cursor = 0;
    build(&tokens, &mut cursor)
}

fn inorder(n: &Option<Box<Node>>, out: &mut Vec<i32>) {
    if let Some(node) = n {
        inorder(&node.left, out);
        out.push(node.val);
        inorder(&node.right, out);
    }
}

fn main() {
    let root = node(1, leaf(2), node(3, leaf(4), leaf(5)));

    let text = serialise(&root);
    println!("serialised: {}", text);
    let rebuilt = deserialise(&text);
    let (mut a, mut b) = (Vec::new(), Vec::new());
    inorder(&root, &mut a);
    inorder(&rebuilt, &mut b);
    println!("inorder of original: {}", list(&a));
    println!("inorder of rebuilt:  {}", list(&b));
    println!("round trip matches:  {}", serialise(&rebuilt) == text);
    println!("empty tree: {}", serialise(&None));
}`,
              output: `serialised: 1,2,#,#,3,4,#,#,5,#,#
inorder of original: [2, 1, 4, 3, 5]
inorder of rebuilt:  [2, 1, 4, 3, 5]
round trip matches:  true
empty tree: #`,
            },
            {
              lang: "go",
              code: `package main

import (
	"fmt"
	"strconv"
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

// Preorder, with an explicit marker for absent children.
func walk(n *Node, out []string) []string {
	if n == nil {
		return append(out, "#")
	}
	out = append(out, strconv.Itoa(n.val))
	out = walk(n.left, out)
	return walk(n.right, out)
}

func serialise(node *Node) string {
	return strings.Join(walk(node, nil), ",")
}

func deserialise(text string) *Node {
	tokens := strings.Split(text, ",")
	cursor := 0
	var build func() *Node
	build = func() *Node {
		token := tokens[cursor]
		cursor++
		if token == "#" {
			return nil
		}
		v, _ := strconv.Atoi(token)
		node := &Node{val: v}
		node.left = build()
		node.right = build()
		return node
	}
	return build()
}

func inorder(n *Node, out []int) []int {
	if n != nil {
		out = inorder(n.left, out)
		out = append(out, n.val)
		out = inorder(n.right, out)
	}
	return out
}

func main() {
	root := &Node{1, &Node{val: 2}, &Node{3, &Node{val: 4}, &Node{val: 5}}}

	text := serialise(root)
	fmt.Println("serialised:", text)
	rebuilt := deserialise(text)
	fmt.Println("inorder of original:", list(inorder(root, nil)))
	fmt.Println("inorder of rebuilt: ", list(inorder(rebuilt, nil)))
	fmt.Println("round trip matches: ", serialise(rebuilt) == text)
	fmt.Println("empty tree:", serialise(nil))
}`,
              output: `serialised: 1,2,#,#,3,4,#,#,5,#,#
inorder of original: [2, 1, 4, 3, 5]
inorder of rebuilt:  [2, 1, 4, 3, 5]
round trip matches:  true
empty tree: #`,
            },
          ],
        },
      ],
      visual: {
        id: "serialise-visual",
        kind: "tree-algorithm",
        algorithm: "preorder",
        lockAlgorithm: true,
        title: "Pre-order — the order the serialiser writes",
      },
    },
    {
      id: "two-traversals",
      heading: "Why two traversals, and why not in-order alone",
      body: [
        "Without markers, one traversal is not enough. **Pre-order alone** gives you the root first but no way to tell where the left subtree ends. **In-order alone** does not even identify the root.",
        "Pre-order plus in-order works: the first pre-order element is the root, its position in the in-order sequence splits that sequence into the left and right subtrees, and the sizes tell you how to split the pre-order sequence too. Recurse.",
        "Post-order plus in-order works the same way, taking the root from the *end* of the post-order sequence.",
        "**Pre-order plus post-order does not** — not uniquely. A node with a single child gives the same pair of sequences whether that child is on the left or the right, so the reconstruction is ambiguous. It becomes unique only if the tree is guaranteed full.",
        "The reason in-order is always one of the two is that it is the only traversal that says *where the root sits relative to its subtrees*. The other two say which node is the root; in-order says how to split.",
        "One practical note: the naive reconstruction scans the in-order array to find the root each time, which is O(n²). Building a map from value to index first makes it O(n) — and that assumes distinct values, which the problem statements duly guarantee.",
      ],
      pitfalls: [
        {
          title: "Sharing the read position incorrectly",
          body: "Deserialisation consumes tokens in order, so the position must be shared across the whole recursion. An index passed by value resets on return and the tree comes out mangled; use an iterator, a mutable holder, or an instance field.",
        },
        {
          title: "Relying on argument evaluation order",
          body: "`Node(next(), build(), build())` leaves the order of the two `build()` calls to the language. Python evaluates left to right; C++ historically did not guarantee it. Assign to `node.left` then `node.right` on separate lines.",
        },
        {
          title: "Trying to rebuild from pre-order plus post-order",
          body: "Not unique for trees that have nodes with one child. If a problem asks for it, it will state that the tree is full — and if it does not, say so rather than producing one of several possible trees.",
        },
        {
          title: "Scanning for the root on every recursive call",
          body: "Turns an O(n) reconstruction into O(n²). Precompute value-to-index once. It relies on values being distinct, which is worth confirming out loud.",
        },
      ],
    },
    {
      id: "the-sheet",
      heading: "The sheet",
      body: [
        "**Maximum Depth** — the base recursion. Start here.",
        "**Same Tree**, **Symmetric Tree** — two-pointer recursion over structure; symmetric is the one where the mirrored comparison order matters.",
        "**Invert Binary Tree** — three lines, and famously asked.",
        "**Path Sum**, **Path Sum II** — carrying state downward.",
        "**Diameter**, **Balanced Binary Tree**, **Maximum Path Sum** — the return-one-thing-record-another family, in increasing difficulty. Do them in that order.",
        "**Level Order**, **Zigzag**, **Right Side View**, **Minimum Depth** — the BFS set.",
        "**Validate BST** — the range check, and the module's most instructive bug.",
        "**Kth Smallest in a BST**, **Range Sum of BST** — in-order with early exit, and pruning.",
        "**Lowest Common Ancestor** in a binary tree, then in a BST. Both, back to back, to feel what the invariant buys.",
        "**Convert Sorted Array to BST** — build balanced by taking the middle.",
        "**Construct from Preorder and Inorder** — the reconstruction, with the index map.",
        "**Serialize and Deserialize Binary Tree** — this lesson's example.",
        "**Binary Tree Iterator** — the explicit stack from the stacks module, and the bridge back to it.",
        "**Flatten to a Linked List**, **Populating Next Right Pointers** — rewiring rather than reading.",
        "Two habits worth carrying into all of them. **Decide the direction first** — does this node need something from above (pre-order) or from below (post-order)? That one question settles the structure of most of these. And **always check the empty tree and the single node**, because a tree recursion that has never been run on null is untested.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "Serialise and deserialise a binary tree.",
      answer:
        "Pre-order with an explicit marker for null children. Deserialising consumes the tokens in the same order: a marker yields null, otherwise build a node then its left subtree then its right. The read position must be shared across the recursion — an iterator or a mutable index, not one passed by value.",
    },
    {
      question: "Why can't you rebuild a tree from its in-order traversal alone?",
      answer:
        "In-order does not identify the root — many different trees share one in-order sequence. It has to be paired with pre-order or post-order, which supply the root; in-order then says where to split. Pre-order plus post-order is not sufficient either, because a node with one child is ambiguous.",
    },
    {
      question: "How do you make the reconstruction O(n)?",
      answer:
        "Precompute a map from value to in-order index instead of scanning for the root at every level, which would be O(n²). It assumes values are distinct — worth confirming, since the problem statements guarantee it.",
    },
  ],
  takeaways: [
    "Pre-order with null markers round-trips exactly",
    "The read position must be shared across the whole recursion",
    "Assign left then right on separate lines — evaluation order is not yours",
    "In-order says where to split; pre or post says which node is the root",
    "Pre-order plus post-order is ambiguous unless the tree is full",
    "Decide pre-order or post-order first — it settles most tree problems",
  ],
  status: "available",
};
