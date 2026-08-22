import type { Lesson } from "@/content/types";

export const levelOrderLesson: Lesson = {
  id: "dsa-tree-level-order",
  slug: "level-order-and-the-width-snapshot",
  moduleSlug: "trees",
  title: "Level-Order, and the Width Snapshot",
  summary:
    "Breadth-first on a tree, with one trick that separates it from a plain queue drain: record the queue's size before draining it, and you get the levels as distinct groups.",
  estimatedMinutes: 30,
  objectives: [
    "Write level-order traversal with levels kept separate",
    "Explain what the width snapshot does and why it works",
    "Recognise the problems that want BFS rather than DFS",
    "Adapt the traversal for zigzag and right-side-view",
  ],
  sections: [
    {
      id: "the-snapshot",
      heading: "The width snapshot",
      body: [
        "Level-order is a queue: push the root, then repeatedly pop a node and push its children. Straightforward, and it produces one flat sequence with no idea where one level ends.",
        "Most problems want the levels separately. The trick is one line: **before draining, record how many nodes are currently in the queue**. That count is exactly the width of the current level, because everything in the queue at that moment came from the level above and nothing from the level below has been added yet.",
        "Drain exactly that many, pushing children as you go, and you have processed one complete level. Repeat until the queue empties.",
        "It is a small thing that turns a plain BFS into the answer for a whole family of problems, and it is worth writing until it is automatic.",
      ],
      examples: [
        {
          id: "level-order",
          title: "Levels, and two things that fall out of them",
          lang: "python",
          code: `from collections import deque

class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

root = Node(4, Node(2, Node(1), Node(3)), Node(7, Node(6)))

def level_order(root):
    if root is None:
        return []
    out, q = [], deque([root])
    while q:
        width = len(q)              # snapshot: how many nodes are on this level
        level = []
        for _ in range(width):
            node = q.popleft()
            level.append(node.val)
            if node.left:  q.append(node.left)
            if node.right: q.append(node.right)
        out.append(level)
    return out

for i, level in enumerate(level_order(root)):
    print(f"level {i}: {level}")

print("right side view:", [lvl[-1] for lvl in level_order(root)])
print("max width:      ", max(len(lvl) for lvl in level_order(root)))`,
          output: `level 0: [4]
level 1: [2, 7]
level 2: [1, 3, 6]
right side view: [4, 7, 6]
max width:       3`,
          explanation:
            "`width = len(q)` is the whole trick. Taking it **before** the inner loop is essential — the loop appends children to the same queue, so reading the length inside would keep growing and never terminate the level. Once levels are separate, right-side-view is the last element of each and maximum width is the longest, so two more problems cost one line each.",
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

function levelOrder(root) {
  if (root === null) return [];
  const out = [];
  let q = [root];
  while (q.length) {
    const width = q.length;        // snapshot: how many nodes are on this level
    const level = [];
    const next = [];
    for (let i = 0; i < width; i++) {
      const node = q[i];
      level.push(node.val);
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    out.push(level);
    q = next;
  }
  return out;
}

levelOrder(root).forEach((level, i) => console.log(\`level \${i}: \${list(level)}\`));

console.log("right side view:", list(levelOrder(root).map((lvl) => lvl[lvl.length - 1])));
console.log("max width:      ", Math.max(...levelOrder(root).map((lvl) => lvl.length)));`,
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

function levelOrder(root: Node | null): number[][] {
  if (root === null) return [];
  const out: number[][] = [];
  let q = [root];
  while (q.length) {
    const width = q.length;        // snapshot: how many nodes are on this level
    const level: number[] = [];
    const next: Node[] = [];
    for (let i = 0; i < width; i++) {
      const node = q[i];
      level.push(node.val);
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    out.push(level);
    q = next;
  }
  return out;
}

levelOrder(root).forEach((level, i) => console.log(\`level \${i}: \${list(level)}\`));

console.log("right side view:", list(levelOrder(root).map((lvl) => lvl[lvl.length - 1])));
console.log("max width:      ", Math.max(...levelOrder(root).map((lvl) => lvl.length)));`,
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

    static List<List<Integer>> levelOrder(Node root) {
        List<List<Integer>> out = new ArrayList<>();
        if (root == null) return out;
        Deque<Node> q = new ArrayDeque<>();
        q.add(root);
        while (!q.isEmpty()) {
            int width = q.size();      // snapshot: how many nodes are on this level
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < width; i++) {
                Node node = q.poll();
                level.add(node.val);
                if (node.left != null) q.add(node.left);
                if (node.right != null) q.add(node.right);
            }
            out.add(level);
        }
        return out;
    }

    public static void main(String[] args) {
        Node root = new Node(4, new Node(2, new Node(1), new Node(3)),
                                new Node(7, new Node(6), null));

        List<List<Integer>> levels = levelOrder(root);
        for (int i = 0; i < levels.size(); i++) {
            System.out.println("level " + i + ": " + list(levels.get(i)));
        }

        List<Integer> rightSide = new ArrayList<>();
        int maxWidth = 0;
        for (List<Integer> lvl : levels) {
            rightSide.add(lvl.get(lvl.size() - 1));
            maxWidth = Math.max(maxWidth, lvl.size());
        }
        System.out.println("right side view: " + list(rightSide));
        System.out.println("max width:       " + maxWidth);
    }
}`,
            },
            {
              lang: "cpp",
              code: `#include <algorithm>
#include <deque>
#include <iostream>
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

vector<vector<int>> levelOrder(Node* root) {
    vector<vector<int>> out;
    if (!root) return out;
    deque<Node*> q{root};
    while (!q.empty()) {
        size_t width = q.size();     // snapshot: how many nodes are on this level
        vector<int> level;
        for (size_t i = 0; i < width; i++) {
            Node* node = q.front();
            q.pop_front();
            level.push_back(node->val);
            if (node->left) q.push_back(node->left);
            if (node->right) q.push_back(node->right);
        }
        out.push_back(level);
    }
    return out;
}

int main() {
    Node* root = new Node(4, new Node(2, new Node(1), new Node(3)),
                             new Node(7, new Node(6)));

    auto levels = levelOrder(root);
    for (size_t i = 0; i < levels.size(); i++) {
        cout << "level " << i << ": " << list(levels[i]) << "\\n";
    }

    vector<int> rightSide;
    size_t maxWidth = 0;
    for (const auto& lvl : levels) {
        rightSide.push_back(lvl.back());
        maxWidth = max(maxWidth, lvl.size());
    }
    cout << "right side view: " << list(rightSide) << "\\n";
    cout << "max width:       " << maxWidth << "\\n";
}`,
            },
            {
              lang: "rust",
              code: `use std::collections::VecDeque;

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

fn list(xs: &[i32]) -> String {
    let parts: Vec<String> = xs.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(", "))
}

fn level_order(root: &Option<Box<Node>>) -> Vec<Vec<i32>> {
    let mut out = Vec::new();
    let start = match root.as_deref() {
        None => return out,
        Some(n) => n,
    };
    let mut q: VecDeque<&Node> = VecDeque::from([start]);
    while !q.is_empty() {
        let width = q.len(); // snapshot: how many nodes are on this level
        let mut level = Vec::new();
        for _ in 0..width {
            let n = q.pop_front().unwrap();
            level.push(n.val);
            if let Some(l) = n.left.as_deref() {
                q.push_back(l);
            }
            if let Some(r) = n.right.as_deref() {
                q.push_back(r);
            }
        }
        out.push(level);
    }
    out
}

fn main() {
    let root = node(4, node(2, leaf(1), leaf(3)), node(7, leaf(6), None));

    let levels = level_order(&root);
    for (i, level) in levels.iter().enumerate() {
        println!("level {}: {}", i, list(level));
    }

    let right_side: Vec<i32> = levels.iter().map(|lvl| *lvl.last().unwrap()).collect();
    let max_width = levels.iter().map(|lvl| lvl.len()).max().unwrap();
    println!("right side view: {}", list(&right_side));
    println!("max width:       {}", max_width);
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

func levelOrder(root *Node) [][]int {
	var out [][]int
	if root == nil {
		return out
	}
	q := []*Node{root}
	for len(q) > 0 {
		width := len(q) // snapshot: how many nodes are on this level
		var level []int
		for i := 0; i < width; i++ {
			node := q[0]
			q = q[1:]
			level = append(level, node.val)
			if node.left != nil {
				q = append(q, node.left)
			}
			if node.right != nil {
				q = append(q, node.right)
			}
		}
		out = append(out, level)
	}
	return out
}

func main() {
	root := &Node{4,
		&Node{2, &Node{val: 1}, &Node{val: 3}},
		&Node{7, &Node{val: 6}, nil}}

	levels := levelOrder(root)
	for i, level := range levels {
		fmt.Printf("level %d: %s\\n", i, list(level))
	}

	var rightSide []int
	maxWidth := 0
	for _, lvl := range levels {
		rightSide = append(rightSide, lvl[len(lvl)-1])
		maxWidth = max(maxWidth, len(lvl))
	}
	fmt.Println("right side view:", list(rightSide))
	fmt.Println("max width:      ", maxWidth)
}`,
            },
          ],
        },
      ],
      visual: {
        id: "levelorder-visual",
        kind: "tree-algorithm",
        algorithm: "levelorder",
        lockAlgorithm: true,
        title: "Level by level, left to right",
      },
    },
    {
      id: "bfs-or-dfs",
      heading: "When BFS beats DFS",
      body: [
        "**Anything phrased by level.** Level averages, level sums, largest value per level, level order itself.",
        "**Anything about the shallowest thing.** Minimum depth, the nearest leaf, the first node satisfying a condition. DFS would explore an entire deep branch before finding a shallow answer; BFS finds it and stops.",
        "**Views.** Right-side view, left-side view, top view, bottom view — all are a level-order with a selection rule per level.",
        "**Width.** Maximum width, and the variant that counts null gaps by tracking positional indices.",
        "**Connecting siblings.** Populating `next` pointers across each level is level-order with one extra assignment.",
        "DFS remains the better tool for anything about paths, subtree properties or values that combine upward. The rough rule: **BFS for questions about distance from the root, DFS for questions about the structure below a node**.",
      ],
      pitfalls: [
        {
          title: "Reading the queue length inside the loop",
          body: "The inner loop appends children to the same queue, so `len(q)` grows while you drain. Capture the width before the loop starts, or levels merge into one another and the loop may not terminate as expected.",
        },
        {
          title: "Using a list as a queue",
          body: "`list.pop(0)` is O(n) and turns the traversal quadratic. `collections.deque` and `ArrayDeque` are the right types — this is the same trap the queues lesson flagged, and tree BFS is where it most often appears.",
        },
        {
          title: "Forgetting the empty tree",
          body: "Pushing a null root makes the first pop yield null and the child accesses throw. Guard at the top and return an empty result.",
        },
        {
          title: "Reversing the queue for zigzag",
          body: "Zigzag order does not need the traversal reversed — reverse the *level list* after collecting it, or append to a deque from alternating ends. Reversing the queue itself corrupts the parent ordering for the next level.",
        },
      ],
    },
    {
      id: "variants",
      heading: "The variants",
      body: [
        "**Zigzag level order.** Alternate the direction of each level's list. Collect normally, then reverse odd levels — simpler and less error-prone than trying to traverse in the alternating direction.",
        "**Minimum depth.** BFS and return the depth of the first leaf encountered. The DFS version is a classic trap: `1 + min(left, right)` is wrong for a node with one missing child, because the missing side reports 0 and wins.",
        "**Populating next right pointers.** Level-order, linking each node to the next in its level's drain. The follow-up asks for O(1) space, which uses the already-built `next` pointers of the level above as the queue.",
        "**Vertical order traversal.** BFS carrying a column index — left child is `col - 1`, right is `col + 1` — collecting into a map from column to values. The ordering rules within a column are the fiddly part, and reading the statement carefully matters more than the algorithm.",
        "**Bottom-up level order.** The same traversal with the result reversed at the end. Never worth traversing differently.",
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "How do you keep levels separate in a level-order traversal?",
      answer:
        "Record the queue's size before draining it — that count is the width of the current level, since everything queued at that moment came from the level above. Drain exactly that many while appending children, and you have processed one complete level.",
    },
    {
      question: "Minimum depth of a binary tree — why is the DFS version a trap?",
      answer:
        "`1 + min(leftDepth, rightDepth)` returns 1 for a node with only one child, because the missing side contributes 0. You must take the minimum only over children that exist, or use BFS and return at the first leaf — which also stops early rather than exploring the whole tree.",
    },
    {
      question: "When would you choose BFS over DFS on a tree?",
      answer:
        "When the question is about distance from the root — levels, shallowest anything, views, width. DFS explores a whole branch before finding a shallow answer. DFS wins for path and subtree questions, where values combine upward.",
    },
  ],
  takeaways: [
    "Snapshot the queue length before draining — that is the level's width",
    "Read it before the inner loop, never inside it",
    "Views, widths and level statistics all fall out of separated levels",
    "BFS for distance from the root; DFS for structure below a node",
    "Use a deque — list.pop(0) makes tree BFS quadratic",
    "Minimum depth via DFS breaks on nodes with one child",
  ],
  status: "available",
};
