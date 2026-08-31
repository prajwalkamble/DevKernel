/**
 * Turning a lesson's `visual` spec into frames.
 *
 * This lived inside `components/visuals/Visual.tsx` until it needed a second
 * caller. The component is the only thing that *renders* a visualisation, but
 * it is not the only thing that should be able to *run* one:
 * `scripts/verify-visual-frames.ts` runs every spec in the content tree and
 * checks the frames are well-formed, and a check that reimplemented this
 * dispatch would be checking its own copy rather than what a reader sees.
 *
 * So the component keeps the state — which algorithm the picker is on, which
 * target the select shows — and everything that turns a spec plus that state
 * into a `Visualisation` lives here.
 */
import type { VisualKind, VisualSpec } from "@/content/types";
import type { Visualisation } from "./types";
import { SORTERS, type SorterName } from "./sorting";
import { SEARCHERS, type SearcherName } from "./searching";
import { GRAPH_ALGOS } from "./graphs";
import { DP_ALGOS } from "./dp";
import { STRING_ALGOS } from "./strings";
import { PATTERN_ALGOS } from "./patterns";
import { TREE_ALGOS } from "./trees";
import { NUMBER_ALGOS } from "./numbers";
import { GREEDY_ALGOS } from "./greedy";
import { REACT_ALGOS } from "./react";
import { REACT_LAYOUT_ALGOS } from "./react-layout";
import { REACT_CONCURRENT_ALGOS } from "./react-concurrent";
import { REACT_SERVER_ALGOS } from "./react-server";
import { REACT_TOOLING_ALGOS } from "./react-tooling";
import { REACT_PATTERN_ALGOS } from "./react-patterns";
import { REACT_STATE_ALGOS } from "./react-state";
import { REACT_DATA_ALGOS } from "./react-data";
import { REACT_PERF_ALGOS } from "./react-perf";
import { REACT_JSX_ALGOS } from "./react-jsx";
import { REACT_ARCH_ALGOS } from "./react-arch";
import { REACT_FORM_ALGOS } from "./react-forms";
import { REACT_MISC_ALGOS } from "./react-misc";
import {
  bstDemo, hashTableDemo, heapDemo, linkedListDemo, queueDemo, stackDemo, trieDemo,
} from "./structures";
import {
  circularBuffer, dequeDemo, doublyLinkedList, dynamicArray, fenwickTree, lruCache, segmentTree,
} from "./structures2";

export const DEFAULT_ARRAY = [42, 17, 93, 8, 65, 31, 76, 24];
export const DEFAULT_SORTED = [4, 9, 14, 22, 31, 47, 58, 63, 79, 88];

export function randomValues(n: number) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 95) + 5);
}

/** A value inside the array's range that is not in it. */
export function missingTarget(values: number[]): number {
  const present = new Set(values);
  for (let v = values[0]; v <= values[values.length - 1]; v++) if (!present.has(v)) return v;
  return values[values.length - 1] + 1;
}

/**
 * The kinds that offer a picker, and the table each one picks from.
 *
 * `Visual` reads the same tables to build the picker, so a kind cannot offer an
 * option the resolver does not know how to run.
 */
export const FAMILIES = {
  graph: { table: GRAPH_ALGOS, fallback: "bfs" },
  dp: { table: DP_ALGOS, fallback: "fibonacci" },
  "string-matching": { table: STRING_ALGOS, fallback: "kmp" },
  pattern: { table: PATTERN_ALGOS, fallback: "twopointers" },
  "tree-algorithm": { table: TREE_ALGOS, fallback: "inorder" },
  "bits-and-math": { table: NUMBER_ALGOS, fallback: "bitops" },
  greedy: { table: GREEDY_ALGOS, fallback: "intervals" },
  "react-rendering": { table: REACT_ALGOS, fallback: "element-tree" },
  "react-structure": { table: REACT_LAYOUT_ALGOS, fallback: "scaffold" },
  "react-concurrent": { table: REACT_CONCURRENT_ALGOS, fallback: "interruptible-render" },
  "react-server": { table: REACT_SERVER_ALGOS, fallback: "ssr-timeline" },
  "react-tooling": { table: REACT_TOOLING_ALGOS, fallback: "query-priority" },
  "react-patterns": { table: REACT_PATTERN_ALGOS, fallback: "compound" },
  "react-state": { table: REACT_STATE_ALGOS, fallback: "snapshot" },
  "react-data": { table: REACT_DATA_ALGOS, fallback: "key-matching" },
  "react-perf": { table: REACT_PERF_ALGOS, fallback: "render-vs-dom" },
  "react-jsx": { table: REACT_JSX_ALGOS, fallback: "element-object" },
  "react-arch": { table: REACT_ARCH_ALGOS, fallback: "state-location" },
  "react-forms": { table: REACT_FORM_ALGOS, fallback: "input-ownership" },
  "react-misc": { table: REACT_MISC_ALGOS, fallback: "attribute-mapping" },
} as const;

export type FamilyKind = keyof typeof FAMILIES;

export type StructureKind = Exclude<
  VisualKind,
  "sorting" | "searching" | FamilyKind
>;

export const STRUCTURE_TITLE: Record<StructureKind, string> = {
  stack: "Stack",
  queue: "Queue",
  deque: "Deque",
  "linked-list": "Linked list",
  "doubly-linked-list": "Doubly linked list",
  "circular-buffer": "Circular buffer",
  "dynamic-array": "Dynamic array",
  bst: "Binary search tree",
  trie: "Trie",
  heap: "Binary min-heap",
  "hash-table": "Hash table with chaining",
  "segment-tree": "Segment tree",
  "fenwick-tree": "Fenwick tree",
  "lru-cache": "LRU cache",
};

export function runStructure(kind: StructureKind, spec: VisualSpec, seed: number): Visualisation {
  const numbers = spec.data;
  const words = spec.words;
  switch (kind) {
    case "stack":
      return stackDemo(numbers ? [...numbers, "pop", "pop"] : [3, 7, 1, "pop", 9, "pop", "pop", "pop"]);
    case "queue":
      return queueDemo(numbers ? [...numbers, "dequeue", "dequeue"] : [3, 7, 1, "dequeue", 9, "dequeue", "dequeue"]);
    case "deque":
      return dequeDemo();
    case "linked-list":
      return linkedListDemo([
        { op: "prepend", value: 7 }, { op: "prepend", value: 3 },
        { op: "append", value: 9 }, { op: "append", value: 12 }, { op: "delete", value: 9 },
      ]);
    case "doubly-linked-list":
      return doublyLinkedList();
    case "circular-buffer":
      return circularBuffer();
    case "dynamic-array":
      return dynamicArray();
    case "bst": {
      const inserts = numbers ?? (seed === 0 ? [50, 30, 70, 20, 40, 60, 80] : randomValues(7));
      return bstDemo(inserts, spec.target ?? inserts[inserts.length - 1]);
    }
    case "trie":
      return trieDemo(words ?? ["cat", "car", "card", "dog"], spec.lookup ?? "car");
    case "heap":
      return heapDemo(numbers ?? (seed === 0 ? [5, 3, 8, 1, 9, 2] : randomValues(6)), 2);
    case "hash-table":
      return hashTableDemo(words ?? ["ana", "bob", "cy", "dee", "eve", "fay"]);
    case "segment-tree":
      return segmentTree(numbers);
    case "fenwick-tree":
      return fenwickTree(numbers);
    case "lru-cache":
      return lruCache();
  }
}

/**
 * What a lesson page shows the moment it renders this spec.
 *
 * Deliberately the *initial* state only: the picker and the shuffle button move
 * a visualisation somewhere this function does not describe. The frame checker
 * covers those separately by running every entry in every table.
 */
export function resolveVisual(spec: VisualSpec): Visualisation & { title: string } {
  if (spec.kind === "sorting") {
    const algorithm = (spec.algorithm as SorterName) ?? "bubble";
    const values = spec.data ?? DEFAULT_ARRAY;
    return { ...SORTERS[algorithm].run(values), title: spec.title ?? SORTERS[algorithm].label };
  }
  if (spec.kind === "searching") {
    const algorithm = (spec.algorithm as SearcherName) ?? "binary";
    const initial = spec.data ?? DEFAULT_SORTED;
    const values = [...initial].sort((a, b) => a - b);
    // Deliberately not the midpoint: binary search would find that on its first
    // look and the animation would be over before it showed anything.
    const target = spec.target ?? initial[initial.length - 2];
    return { ...SEARCHERS[algorithm].run(values, target), title: spec.title ?? SEARCHERS[algorithm].label };
  }
  if (spec.kind in FAMILIES) {
    const { table, fallback } = FAMILIES[spec.kind as FamilyKind];
    const entries = table as Record<string, { label: string; run: () => Visualisation }>;
    const algorithm = spec.algorithm && spec.algorithm in entries ? spec.algorithm : fallback;
    return { ...entries[algorithm].run(), title: spec.title ?? entries[algorithm].label };
  }
  const kind = spec.kind as StructureKind;
  return { ...runStructure(kind, spec, 0), title: spec.title ?? STRUCTURE_TITLE[kind] };
}
