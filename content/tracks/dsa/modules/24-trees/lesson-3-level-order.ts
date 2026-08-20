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
