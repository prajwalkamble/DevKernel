import type { Lesson } from "@/content/types";

export const balancingLesson: Lesson = {
  id: "dsa-tree-balance",
  slug: "balancing-avl-red-black-and-your-treemap",
  moduleSlug: "trees",
  title: "Balancing: AVL, Red-Black, and What Your TreeMap Is",
  summary:
    "A BST only keeps its reputation if something stops it degenerating. Rotations are the mechanism, and the difference between AVL and red-black is how strictly each insists — which decides whether reads or writes are favoured.",
  estimatedMinutes: 30,
  objectives: [
    "Explain what a rotation does and what it preserves",
    "State the AVL and red-black balance conditions",
    "Say which to prefer for read-heavy and write-heavy workloads",
    "Name what your language's ordered map actually is",
  ],
  sections: [
    {
      id: "rotations",
      heading: "Rotations",
      body: [
        "A **rotation** rearranges three nodes locally, changing the height of the subtree while keeping in-order sequence identical. That last clause is the whole reason it is safe: the BST invariant is exactly a statement about in-order sequence, so an operation that preserves it cannot break the tree.",
        "Rotating right takes the left child up and the old root down to its right; rotating left is the mirror. The orphaned middle subtree moves across to the side that has room — that reattachment is the only fiddly part, and it is the same in every implementation.",
        "Four cases arise, and they are two cases wearing four names. **Left-left** and **right-right** need one rotation. **Left-right** and **right-left** need two — rotate the child first to convert the case into a straight line, then rotate the root.",
        "That is the entire mechanical content of balancing. What differs between the schemes is when they decide a rotation is required.",
      ],
      visual: {
        id: "avl-visual",
        kind: "tree-algorithm",
        algorithm: "avl",
        lockAlgorithm: true,
        title: "Rotations restoring balance after an insert",
      },
    },
    {
      id: "avl-vs-rb",
      heading: "AVL and red-black, and what the difference buys",
      body: [
        "**AVL** requires that the heights of every node's two subtrees differ by at most one. Each node stores its height, and after every insert or delete the path back to the root is checked and rotated where needed.",
        "**Red-black** colours each node and enforces four weaker rules — the root is black, no red node has a red child, every root-to-leaf path contains the same number of black nodes, and null links count as black. Those imply the longest path is at most twice the shortest.",
        "So AVL is **more strictly balanced**: height around 1.44·log n against red-black's 2·log n. Its lookups are therefore slightly faster.",
        "Red-black **does less work to maintain**: at most two rotations per insert and three per delete, where AVL may rotate all the way up the path on a delete. Its writes are therefore faster.",
        "The rule that follows: **AVL for read-heavy workloads, red-black for write-heavy ones**. Databases index with B-trees for a different reason again — disk pages — but the same logic, that the maintenance cost is the thing being traded.",
        "Neither is worth implementing from memory in an interview. What is worth having is the *reason they differ*, which is the answer above.",
      ],
    },
    {
      id: "what-you-use",
      heading: "What your language actually gives you",
      body: [
        "**Java** — `TreeMap` and `TreeSet` are red-black trees. `HashMap` treeifies long collision chains into red-black trees too, which is the mitigation from the hashing module.",
        "**C++** — `std::map`, `std::set`, `std::multimap` are red-black in every mainstream implementation. The standard specifies the complexity rather than the structure, but that is what you get.",
        "**Rust** — `BTreeMap` and `BTreeSet` are B-trees rather than binary, chosen for cache behaviour: a wide node fills a cache line, so fewer cache misses per lookup than a binary tree with the same element count.",
        "**Python** — nothing in the standard library. `sortedcontainers` is the usual answer and is not a tree at all; it maintains a list of sorted lists, which measures faster than a tree in CPython because the constant factors of Python-level node objects are brutal.",
        "**Go** — nothing. Sorted slices with `sort.Search` are idiomatic.",
        "The pattern is that the *interface* — ordered map with O(log n) operations plus range queries — is universal, and the structure behind it is chosen for the language's own performance realities. Two of those five are not binary trees at all.",
      ],
      pitfalls: [
        {
          title: "Believing a rotation can break the ordering",
          body: "It cannot. A rotation preserves in-order sequence exactly, which is why it is the legal move. If your implementation breaks the invariant, the bug is in the subtree reattachment, not in the idea.",
        },
        {
          title: "Forgetting to update heights after rotating",
          body: "In AVL, heights must be recomputed bottom-up — the rotated nodes first, then upward. Updating in the wrong order leaves stale heights and the next balance decision is made on wrong data, which produces a tree that is neither balanced nor obviously broken.",
        },
        {
          title: "Assuming an ordered map is a binary tree",
          body: "Rust's BTreeMap is a B-tree and Python's sortedcontainers is a list of lists. Both satisfy the same interface with different structures, for cache and constant-factor reasons. Do not reason about their internals from the name.",
        },
        {
          title: "Reaching for a self-balancing tree in an interview",
          body: "Almost no interview wants an AVL implementation. What is wanted is that you know the height bound, why it matters, and which library type provides it. Describing the rotation cases is usually enough depth.",
        },
      ],
    },
  ],
  interviewQuestions: [
    {
      question: "What does a rotation do, and why is it safe?",
      answer:
        "It rearranges three nodes to change a subtree's height while leaving the in-order sequence unchanged. Since the BST invariant is exactly a claim about in-order order, an operation preserving that order cannot violate it.",
    },
    {
      question: "AVL or red-black?",
      answer:
        "AVL is more strictly balanced — height about 1.44·log n versus 2·log n — so lookups are faster. Red-black needs fewer rotations per update, bounded at two per insert and three per delete, so writes are faster. AVL for read-heavy, red-black for write-heavy. Java's TreeMap and C++'s std::map are red-black.",
    },
    {
      question: "What is Rust's BTreeMap, and why not a binary tree?",
      answer:
        "A B-tree. Each node holds many keys, so one node fills a cache line and a lookup incurs far fewer cache misses than descending a binary tree of the same size. It is the same trade databases make for disk pages, applied to cache.",
    },
  ],
  takeaways: [
    "A rotation changes height and preserves in-order sequence",
    "Four cases, two shapes — the zig-zag ones need a rotation first",
    "AVL: strictly balanced, faster reads, more rotations on write",
    "Red-black: looser, bounded rotations, faster writes",
    "TreeMap and std::map are red-black; BTreeMap is a B-tree",
    "Python and Go ship no ordered map at all",
  ],
  status: "available",
};
