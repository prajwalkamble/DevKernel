import type { Problem } from "../types";

export const treeGraphProblems: Problem[] = [
  {
    id: "binary-tree-level-order-traversal",
    slug: "binary-tree-level-order-traversal",
    title: "Binary Tree Level Order Traversal",
    difficulty: "medium",
    topics: ["trees"],
    patterns: ["tree-dfs", "tree-bfs"],
    companies: ["Amazon", "Microsoft", "Meta", "Bloomberg", "Adobe", "Oracle"],
    prompt: "Return the node values level by level, top to bottom.",
    statement: [
      "Given the root of a binary tree, return the level-order traversal of its nodes' values — that is, from left to right, level by level.",
      "The result is a list of lists, one per level.",
    ],
    constraints: ["The number of nodes is in the range [0, 2000]", "−1000 ≤ Node.val ≤ 1000"],
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "[[3],[9,20],[15,7]]", explanation: "Three levels: the root, its two children, then the two children of 20." },
      { input: "root = [1]", output: "[[1]]" },
      { input: "root = []", output: "[]", explanation: "The empty tree. Handle it before touching the queue, or the first dereference crashes." },
    ],
    signals: [
      "**\"Level by level\"** with the levels kept separate is BFS's signature. If the output were one flat list, either traversal would do — it is the grouping that decides it.",
      "**The node count can be 0.** Every tree problem's first edge case is the empty tree, and this one is stated in the constraints rather than left implicit.",
      "**\"Left to right\"** fixes the order children are enqueued in. Swap them and you get a mirrored answer that passes on symmetric test cases and fails on real ones.",
      "The recursive alternative is worth knowing precisely because it is surprising: DFS can produce level order too, if each call knows its own depth. Having both in hand tells you which one a variant of the problem actually needs.",
    ],
    judge: {
      entry: "levelOrder",
      params: [
        { name: "root", type: "tree" },
      ],
      returns: "List<List<int>>",
      cases: [
        { args: [[3, 9, 20, null, null, 15, 7]], expected: [[3], [9, 20], [15, 7]], visible: true },
        { args: [[1]], expected: [[1]], visible: true },
        { args: [[]], expected: [], visible: true },
        {
          args: [[1, 2, 3, 4, null, null, 5]],
          expected: [[1], [2, 3], [4, 5]],
          note: "Gaps in the middle of a level.",
        },
        {
          args: [[1, null, 2, null, 3]],
          expected: [[1], [2], [3]],
          note: "A chain leaning entirely right — every level holds one node.",
        },
        {
          args: [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]],
          expected: [[5], [4, 8], [11, 13, 4], [7, 2, 1]],
          note: "Four levels, ragged at the bottom.",
        },
      ],
    },
    approaches: [
      {
        id: "dfs",
        tier: "better",
        title: "DFS carrying the depth",
        intuition: [
          "Level order does not strictly require a queue. What it requires is knowing which level each node belongs to — and a recursive walk can carry its depth as a parameter.",
          "Keep a list of levels. When a call at depth `d` finds that `levels` has only `d` entries, it is the first node ever seen at that depth, so it appends a new empty level. Then it appends its own value to `levels[d]`.",
          "Left-to-right ordering within each level falls out for free, because the recursion visits the left subtree first and appends in visit order.",
          "This is worth having because it generalises: 'the rightmost node of each level' and 'the sum per level' are one-line changes here, whereas the BFS version needs restructuring.",
        ],
        time: "O(n)",
        space: "O(h) for the call stack, plus the output",
        java: `import java.util.ArrayList;
import java.util.List;

class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> levels = new ArrayList<>();
        collect(root, 0, levels);
        return levels;
    }

    private void collect(TreeNode node, int depth, List<List<Integer>> levels) {
        if (node == null) {
            return;
        }
        if (depth == levels.size()) {
            levels.add(new ArrayList<>());
        }
        levels.get(depth).add(node.val);
        collect(node.left, depth + 1, levels);
        collect(node.right, depth + 1, levels);
    }
}`,
        python: `class Solution:
    def level_order(self, root: "TreeNode | None") -> list[list[int]]:
        levels: list[list[int]] = []

        def collect(node: "TreeNode | None", depth: int) -> None:
            if node is None:
                return
            if depth == len(levels):
                levels.append([])
            levels[depth].append(node.val)
            collect(node.left, depth + 1)
            collect(node.right, depth + 1)

        collect(root, 0)
        return levels`,
        verdict:
          "Linear and correct, and the empty tree needs no special case — the first call returns immediately. Its weakness is the stack: a degenerate 2000-node tree is 2000 frames deep, fine here but not at 10⁵ nodes.",
      },
      {
        id: "optimal",
        tier: "optimal",
        title: "BFS with a level-width snapshot",
        intuition: [
          "Put the root in a queue. Then repeatedly: read how many nodes are in the queue, and process exactly that many. Those are precisely one level.",
          "The whole trick is **freezing the size before the inner loop**. The queue grows while you drain it, as children are enqueued — so reading `queue.size()` inside the loop condition would sweep the next level into the current one. Snapshot it first.",
          "The invariant: at the top of each outer iteration the queue holds exactly one complete level, in left-to-right order. Enqueuing left before right is what maintains the second half of that.",
          "Guard the empty tree before the loop. `ArrayDeque` in Java rejects null outright, which turns a silent wrong answer into a loud one — that is a feature.",
          "Use a real queue. `list.pop(0)` in Python is O(n) and turns the traversal quadratic; `collections.deque` is O(1) at both ends.",
        ],
        walkthrough: [
          "Null root — return an empty list.",
          "Queue holding the root.",
          "While the queue is non-empty: `width = queue.size()`.",
          "Repeat `width` times: dequeue, record the value, enqueue the non-null children.",
          "Append the collected level.",
        ],
        time: "O(n) — every node enters and leaves the queue once",
        space: "O(w), the widest level — up to n/2 for a complete tree",
        java: `import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> levels = new ArrayList<>();
        if (root == null) {
            return levels;
        }

        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            int width = queue.size();
            List<Integer> level = new ArrayList<>(width);
            for (int i = 0; i < width; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) {
                    queue.add(node.left);
                }
                if (node.right != null) {
                    queue.add(node.right);
                }
            }
            levels.add(level);
        }
        return levels;
    }
}`,
        python: `from collections import deque


class Solution:
    def level_order(self, root: "TreeNode | None") -> list[list[int]]:
        if root is None:
            return []

        levels: list[list[int]] = []
        queue = deque([root])
        while queue:
            level = []
            for _ in range(len(queue)):
                node = queue.popleft()
                level.append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
            levels.append(level)
        return levels`,
        verdict:
          "The answer to give. Linear time, iterative so no stack limit, and the level-width snapshot is a technique you will reuse in half a dozen problems. Note the space profiles are opposite: DFS costs O(height), BFS costs O(width) — so a deep skinny tree favours BFS and a wide shallow one favours DFS.",
      },
    ],
    followUps: [
      "Zigzag order? Same traversal, reversing alternate levels — or better, appending to the front of a deque on odd levels, which avoids the reversal cost.",
      "The right-side view? Take the last value of each level. Or, with the DFS version, visit right before left and record the first node seen at each new depth.",
      "Bottom-up level order? Build it as normal and reverse at the end, or insert each level at index 0 — the latter is O(n) per insert, so it is the wrong instinct.",
    ],
    related: ["number-of-islands"],
  },
  {
    id: "number-of-islands",
    slug: "number-of-islands",
    title: "Number of Islands",
    difficulty: "medium",
    topics: ["graphs"],
    patterns: ["graph-traversal"],
    companies: ["Amazon", "Google", "Meta", "Microsoft", "Bloomberg", "Uber", "Flipkart"],
    prompt: "Count the connected blobs of land in a grid.",
    statement: [
      "Given an `m × n` 2D grid of `'1'`s (land) and `'0'`s (water), return the number of islands.",
      "An island is surrounded by water and is formed by connecting adjacent land cells horizontally or vertically. You may assume all four edges of the grid are surrounded by water.",
    ],
    constraints: [
      "m == grid.length, n == grid[i].length",
      "1 ≤ m, n ≤ 300",
      "grid[i][j] is '0' or '1'",
    ],
    examples: [
      {
        input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        output: "1",
        explanation: "All the land is connected — including the two cells at column 3, which join the main blob through row 0.",
      },
      {
        input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        output: "3",
        explanation: "Note the single cell at (2,2) and the pair at (3,3)-(3,4) touch only diagonally, and diagonal does not count as connected.",
      },
      { input: 'grid = [["0"]]', output: "0" },
    ],
    signals: [
      "**\"Connected\"** is the word that makes this a graph problem. There is no explicit graph in the input — the grid *is* the graph, with each cell a node and each of its four orthogonal neighbours an edge. Seeing that is the whole insight.",
      "**\"Horizontally or vertically\"** fixes the neighbour set at four, not eight. The second example exists specifically to catch anyone who included diagonals.",
      "**Counting islands means counting connected components**, and the standard way to do that is: try to start a traversal from every cell, and count how many times a traversal actually starts. Cells reached by an earlier traversal never start a new one.",
      "**300 × 300 = 90,000 cells**, so anything linear in the grid is fine. But that is also 90,000 frames deep in the worst case — a grid that is entirely land — which is what decides between the recursive and iterative versions.",
      "**The grid is mutable and made of characters.** That is quiet permission to mark visited cells by overwriting them with `'0'`, saving a whole second grid.",
    ],
    judge: {
      entry: "numIslands",
      params: [
        { name: "grid", type: "char[][]" },
      ],
      returns: "int",
      cases: [
        {
          args: [[["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]]],
          expected: 1,
          visible: true,
        },
        {
          args: [[["1", "1", "0", "0", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "1", "0", "0"], ["0", "0", "0", "1", "1"]]],
          expected: 3,
          visible: true,
        },
        { args: [[["0"]]], expected: 0, visible: true },
        { args: [[["1"]]], expected: 1, note: "A one-cell island." },
        {
          args: [[["1", "0", "1", "0", "1"]]],
          expected: 3,
          note: "A single row: three islands separated by water.",
        },
        { args: [[["1", "1"], ["1", "1"]]], expected: 1, note: "One solid block, not four cells." },
      ],
    },
    approaches: [
      {
        id: "dfs",
        tier: "better",
        title: "Flood fill with recursion",
        intuition: [
          "Scan every cell. When you meet land that has not been consumed yet, you have found a new island — increment the counter, then sink the entire island so it is never counted again.",
          "Sinking is a depth-first flood fill: set the cell to water, then recurse in the four directions. Cells that are off the grid or already water return immediately, which handles both the borders and the termination in one condition.",
          "The mutation *is* the visited-set. Overwriting land with water means a cell can never be entered twice, and it costs no extra memory.",
          "Guard at the top of the recursive call rather than before each of the four calls. One check instead of four, and no chance of missing one.",
        ],
        time: "O(m · n) — every cell is visited a constant number of times",
        space: "O(m · n) worst case for the call stack, on an all-land grid",
        java: `class Solution {
    public int numIslands(char[][] grid) {
        int islands = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == '1') {
                    islands++;
                    sink(grid, r, c);
                }
            }
        }
        return islands;
    }

    private void sink(char[][] grid, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != '1') {
            return;
        }
        grid[r][c] = '0';
        sink(grid, r + 1, c);
        sink(grid, r - 1, c);
        sink(grid, r, c + 1);
        sink(grid, r, c - 1);
    }
}`,
        python: `import sys


class Solution:
    def num_islands(self, grid: list[list[str]]) -> int:
        sys.setrecursionlimit(10_000)
        rows, cols = len(grid), len(grid[0])

        def sink(r: int, c: int) -> None:
            if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != "1":
                return
            grid[r][c] = "0"
            sink(r + 1, c)
            sink(r - 1, c)
            sink(r, c + 1)
            sink(r, c - 1)

        islands = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "1":
                    islands += 1
                    sink(r, c)
        return islands`,
        verdict:
          "The shortest correct answer, and the one to write if the grid is small. Its problem is the stack: a 300 × 300 all-land grid is a 90,000-deep recursion, which blows Java's default stack and exceeds Python's recursion limit — hence the `setrecursionlimit` call, which is itself a warning sign rather than a fix.",
      },
      {
        id: "bfs",
        tier: "optimal",
        title: "Flood fill with an explicit queue",
        intuition: [
          "Same algorithm, same complexity, with the recursion stack replaced by a queue you control. The depth limit disappears.",
          "Mark each cell as water **when you enqueue it**, never when you dequeue it. Marking on dequeue is correct but lets the same cell sit in the queue several times over, and on a large open grid that is a real memory blow-up. This is the single most common bug in BFS and it does not show up on small tests.",
          "The direction array keeps the four neighbours in one place instead of four copy-pasted blocks — fewer places for a sign error to hide.",
          "The outer double loop is unchanged: every start of a traversal is one island.",
        ],
        walkthrough: [
          "For every cell: skip it unless it is land.",
          "Increment the island count, mark the cell as water, and put it in a queue.",
          "While the queue is non-empty: dequeue a cell and, for each of its four neighbours that is land, mark it as water and enqueue it.",
        ],
        time: "O(m · n)",
        space: "O(min(m, n)) for the queue in the typical case, O(m · n) in the worst",
        java: `import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    private static final int[][] STEPS = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } };

    public int numIslands(char[][] grid) {
        int rows = grid.length;
        int cols = grid[0].length;
        int islands = 0;

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] != '1') {
                    continue;
                }
                islands++;
                grid[r][c] = '0';

                Deque<int[]> queue = new ArrayDeque<>();
                queue.add(new int[] { r, c });
                while (!queue.isEmpty()) {
                    int[] cell = queue.poll();
                    for (int[] step : STEPS) {
                        int nr = cell[0] + step[0];
                        int nc = cell[1] + step[1];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == '1') {
                            grid[nr][nc] = '0';
                            queue.add(new int[] { nr, nc });
                        }
                    }
                }
            }
        }
        return islands;
    }
}`,
        python: `from collections import deque


class Solution:
    def num_islands(self, grid: list[list[str]]) -> int:
        rows, cols = len(grid), len(grid[0])
        islands = 0

        for r in range(rows):
            for c in range(cols):
                if grid[r][c] != "1":
                    continue
                islands += 1
                grid[r][c] = "0"

                queue = deque([(r, c)])
                while queue:
                    cr, cc = queue.popleft()
                    for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":
                            grid[nr][nc] = "0"
                            queue.append((nr, nc))
        return islands`,
        verdict:
          "The answer to give in an interview: same asymptotics, no stack risk, and it lets you say something precise about why. If the interviewer objects to mutating the input, swap in a `visited` boolean grid — that costs O(m · n) memory and changes nothing else.",
      },
    ],
    followUps: [
      "What if you could not modify the grid? Keep a separate `visited` array. Mention it unprompted — mutating an input is a real design decision, not a free optimisation.",
      "What if the grid arrived as a stream of 'add land here' operations, and you had to report the island count after each? That is union-find: each new cell unions with its land neighbours, and the component count drops by one per successful union.",
      "Max Area of Island, Surrounded Regions, Rotting Oranges, Pacific Atlantic Water Flow — all the same flood fill with a different thing tracked. Recognising the family turns five problems into one.",
    ],
    related: ["binary-tree-level-order-traversal"],
  },
];
