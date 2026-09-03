"use client";

import { useState } from "react";
import clsx from "clsx";
import type { VisualSpec } from "@/content/types";
import { Visual } from "./Visual";

interface Entry {
  id: string;
  group: "Algorithms" | "Linear structures" | "Trees & tables";
  label: string;
  blurb: string;
  spec: VisualSpec;
}

/**
 * Every visualisation in one place.
 *
 * Ordered so that the two algorithm families come first — they are what people
 * arrive wanting to see — and the structures follow in the order the DSA track
 * introduces them, so the page doubles as a map of the syllabus.
 */
const ENTRIES: Entry[] = [
  {
    id: "sorting", group: "Algorithms", label: "Sorting",
    blurb: "Ten algorithms on the same data. Watch the comparison and swap counts diverge — that difference is the complexity you have been reading about.",
    spec: { id: "g-sorting", kind: "sorting", algorithm: "bubble" },
  },
  {
    id: "searching", group: "Algorithms", label: "Searching",
    blurb: "Five strategies on one sorted array. Set the target to one that is absent and watch how each behaves.",
    spec: { id: "g-searching", kind: "searching", algorithm: "binary" },
  },
  {
    id: "graph", group: "Algorithms", label: "Graph algorithms",
    blurb: "BFS and DFS, Dijkstra, topological sort, Kruskal's MST, Union-Find and Floyd–Warshall, on graphs small enough to follow by eye.",
    spec: { id: "g-graph", kind: "graph", algorithm: "bfs" },
  },
  {
    id: "dp", group: "Algorithms", label: "Dynamic programming",
    blurb: "The table filling in, cell by cell, with the dependencies lit up. This is the one place where the picture genuinely is the algorithm.",
    spec: { id: "g-dp", kind: "dp", algorithm: "lcs" },
  },
  {
    id: "pattern", group: "Algorithms", label: "Patterns",
    blurb: "Eleven shapes the DSA track is built around: two pointers and sliding windows, prefix sums and Kadane's, Floyd's cycle detection, and the in-place array work — compaction, rotation by reversal, the Dutch national flag, cyclic sort, spiral order and rotating a grid.",
    spec: { id: "g-pattern", kind: "pattern", algorithm: "twopointers" },
  },
  {
    id: "tree-algorithm", group: "Algorithms", label: "Tree algorithms",
    blurb: "The four traversals on one tree, plus BST deletion and the AVL rotations that stop a tree degenerating into a list.",
    spec: { id: "g-tree", kind: "tree-algorithm", algorithm: "inorder" },
  },
  {
    id: "bits-and-math", group: "Algorithms", label: "Bits and number theory",
    blurb: "A mask's eight bits under the five operations, XOR cancelling in pairs, the sieve crossing out, and Euclid halving. The bit pictures are of a single number rather than a collection, which is exactly the habit a bitmask asks you to build.",
    spec: { id: "g-bits", kind: "bits-and-math", algorithm: "bitops" },
  },
  {
    id: "greedy", group: "Algorithms", label: "Greedy algorithms",
    blurb: "Interval scheduling and merging on a Gantt grid, Huffman built from a heap, and coin change run twice — on a system where the rule is optimal and on one where the same rule is wrong. A rejected option stays rejected, which is the difference between greedy and backtracking.",
    spec: { id: "g-greedy", kind: "greedy", algorithm: "intervals" },
  },
  {
    id: "string-matching", group: "Algorithms", label: "String matching",
    blurb: "Naive, KMP and Rabin–Karp on the same text. The whole point of KMP is what happens after a mismatch, and you have to see it slide.",
    spec: { id: "g-string", kind: "string-matching", algorithm: "kmp" },
  },

  {
    id: "dynamic-array", group: "Linear structures", label: "Dynamic array",
    blurb: "The doubling, and the copy that makes one append O(n) while the average stays O(1).",
    spec: { id: "g-dynarray", kind: "dynamic-array" },
  },
  {
    id: "stack", group: "Linear structures", label: "Stack",
    blurb: "Push and pop at one end. Last in, first out.",
    spec: { id: "g-stack", kind: "stack" },
  },
  {
    id: "queue", group: "Linear structures", label: "Queue",
    blurb: "Join at the rear, leave from the front. First in, first out.",
    spec: { id: "g-queue", kind: "queue" },
  },
  {
    id: "deque", group: "Linear structures", label: "Deque",
    blurb: "Both ends in O(1) — a stack and a queue at once.",
    spec: { id: "g-deque", kind: "deque" },
  },
  {
    id: "circular-buffer", group: "Linear structures", label: "Circular buffer",
    blurb: "A queue in a fixed array, where the indices wrap and nothing is ever shifted.",
    spec: { id: "g-ring", kind: "circular-buffer" },
  },
  {
    id: "linked-list", group: "Linear structures", label: "Linked list",
    blurb: "Prepending is O(1); appending walks the whole list. Watch the walk — that is the cost arrays do not pay.",
    spec: { id: "g-list", kind: "linked-list" },
  },
  {
    id: "doubly-linked-list", group: "Linear structures", label: "Doubly linked list",
    blurb: "A backward pointer buys O(1) deletion with no search for the predecessor.",
    spec: { id: "g-dlist", kind: "doubly-linked-list" },
  },

  {
    id: "bst", group: "Trees & tables", label: "Binary search tree",
    blurb: "Every insert follows one path down. Shuffle a few times and watch a badly-ordered input produce a tree that is really a list.",
    spec: { id: "g-bst", kind: "bst" },
  },
  {
    id: "heap", group: "Trees & tables", label: "Binary heap",
    blurb: "Shown as a tree and as the array it actually is, side by side — because those are the same object.",
    spec: { id: "g-heap", kind: "heap" },
  },
  {
    id: "trie", group: "Trees & tables", label: "Trie",
    blurb: "Words sharing a prefix share a path. The ring marks a node that ends a word.",
    spec: { id: "g-trie", kind: "trie" },
  },
  {
    id: "segment-tree", group: "Trees & tables", label: "Segment tree",
    blurb: "A range query answered by a handful of nodes — take one whole, discard one, descend only where the query straddles a boundary.",
    spec: { id: "g-segtree", kind: "segment-tree" },
  },
  {
    id: "fenwick-tree", group: "Trees & tables", label: "Fenwick tree",
    blurb: "Prefix sums from one array and some index arithmetic. `i & -i` is the entire structure.",
    spec: { id: "g-fenwick", kind: "fenwick-tree" },
  },
  {
    id: "hash-table", group: "Trees & tables", label: "Hash table",
    blurb: "Keys hash to buckets, and two keys landing in one bucket is a collision. This is where the asterisk on O(1) comes from.",
    spec: { id: "g-hash", kind: "hash-table" },
  },
  {
    id: "lru-cache", group: "Trees & tables", label: "LRU cache",
    blurb: "A hash map for lookup and a linked list for recency — neither alone gives you both in O(1).",
    spec: { id: "g-lru", kind: "lru-cache" },
  },
];

export function VisualizeGallery() {
  const [active, setActive] = useState<string>(ENTRIES[0].id);
  const entry = ENTRIES.find((e) => e.id === active) ?? ENTRIES[0];
  const groups: Entry["group"][] = ["Algorithms", "Linear structures", "Trees & tables"];

  return (
    <div className="page-shell px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Visualize
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Every animation here is produced by running the real algorithm and recording
          what it did, so what you are watching is the code rather than a drawing of it.
          Step with the arrow keys, play with space.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[13rem_1fr]">
        <nav aria-label="Visualizations" className="space-y-4">
          {groups.map((group) => (
            <div key={group}>
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                {group}
              </p>
              <ul className="space-y-0.5">
                {ENTRIES.filter((e) => e.group === group).map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setActive(e.id)}
                      aria-current={e.id === active ? "true" : undefined}
                      className={clsx(
                        "w-full cursor-pointer rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                        e.id === active
                          ? "bg-accent-soft font-medium text-accent"
                          : "text-foreground/80 hover:bg-surface-hover hover:text-foreground"
                      )}
                    >
                      {e.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="min-w-0">
          <p className="text-sm leading-relaxed text-foreground/85">{entry.blurb}</p>
          <Visual key={entry.id} spec={entry.spec} />
        </div>
      </div>
    </div>
  );
}
