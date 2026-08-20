"use client";

import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import type { VisualKind, VisualSpec } from "@/content/types";
import type { Frame, Visualisation } from "@/lib/visuals/types";
import { SORTERS, type SorterName } from "@/lib/visuals/sorting";
import { SEARCHERS, type SearcherName } from "@/lib/visuals/searching";
import { GRAPH_ALGOS } from "@/lib/visuals/graphs";
import { DP_ALGOS } from "@/lib/visuals/dp";
import { STRING_ALGOS } from "@/lib/visuals/strings";
import { PATTERN_ALGOS } from "@/lib/visuals/patterns";
import { TREE_ALGOS } from "@/lib/visuals/trees";
import {
  bstDemo, hashTableDemo, heapDemo, linkedListDemo, queueDemo, stackDemo, trieDemo,
} from "@/lib/visuals/structures";
import {
  circularBuffer, dequeDemo, doublyLinkedList, dynamicArray, fenwickTree, lruCache, segmentTree,
} from "@/lib/visuals/structures2";
import { VisualPlayer } from "./VisualPlayer";
import {
  ArrayCanvas, BucketCanvas, GraphCanvas, HeapCanvas, MatrixCanvas, SequenceCanvas, TreeCanvas,
} from "./canvases";

const DEFAULT_ARRAY = [42, 17, 93, 8, 65, 31, 76, 24];
const DEFAULT_SORTED = [4, 9, 14, 22, 31, 47, 58, 63, 79, 88];

function draw(frame: Frame) {
  switch (frame.kind) {
    case "array": return <ArrayCanvas frame={frame} />;
    case "heap": return <HeapCanvas frame={frame} />;
    case "tree": return <TreeCanvas frame={frame} />;
    case "sequence": return <SequenceCanvas frame={frame} />;
    case "buckets": return <BucketCanvas frame={frame} />;
    case "graph": return <GraphCanvas frame={frame} />;
    case "matrix": return <MatrixCanvas frame={frame} />;
  }
}

function Picker<T extends string>({
  value, options, onChange, label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="cursor-pointer rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
      >
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );
}

function ShuffleButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground">
      <Shuffle className="h-3 w-3" />
      Shuffle
    </button>
  );
}

function randomValues(n: number) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 95) + 5);
}

/** A value inside the array's range that is not in it. */
function missingTarget(values: number[]): number {
  const present = new Set(values);
  for (let v = values[0]; v <= values[values.length - 1]; v++) if (!present.has(v)) return v;
  return values[values.length - 1] + 1;
}

/**
 * Renders a lesson's `visual` spec.
 *
 * Every frame is generated in the browser by running the real algorithm from
 * `lib/visuals`, so a visualisation cannot drift out of step with the code it
 * depicts. Nothing here is a stored animation.
 */
export function Visual({ spec }: { spec: VisualSpec }) {
  switch (spec.kind) {
    case "sorting": return <SortingVisual spec={spec} />;
    case "searching": return <SearchingVisual spec={spec} />;
    case "graph": return <FamilyVisual spec={spec} table={GRAPH_ALGOS} fallback="bfs" />;
    case "dp": return <FamilyVisual spec={spec} table={DP_ALGOS} fallback="fibonacci" />;
    case "string-matching": return <FamilyVisual spec={spec} table={STRING_ALGOS} fallback="kmp" />;
    case "pattern": return <FamilyVisual spec={spec} table={PATTERN_ALGOS} fallback="twopointers" />;
    case "tree-algorithm": return <FamilyVisual spec={spec} table={TREE_ALGOS} fallback="inorder" />;
    default: return <StructureVisual spec={spec} kind={spec.kind} />;
  }
}

/* -------------------------------------------------- algorithm families -- */

/** A family with a picker: graphs, DP, string matching, patterns, traversals. */
function FamilyVisual<T extends string>({
  spec, table, fallback,
}: {
  spec: VisualSpec;
  table: Record<T, { label: string; run: () => Visualisation }>;
  fallback: T;
}) {
  const initial = ((spec.algorithm as T) in table ? (spec.algorithm as T) : fallback);
  const [algorithm, setAlgorithm] = useState<T>(initial);
  const { frames, summary } = useMemo(() => table[algorithm].run(), [table, algorithm]);

  return (
    <VisualPlayer
      key={algorithm}
      frames={frames}
      summary={summary}
      title={spec.title ?? table[algorithm].label}
      controls={spec.lockAlgorithm ? undefined : (
        <Picker
          label="Algorithm"
          value={algorithm}
          onChange={setAlgorithm}
          options={(Object.keys(table) as T[]).map((id) => ({ id, label: table[id].label }))}
        />
      )}
    >
      {(frame) => draw(frame)}
    </VisualPlayer>
  );
}

/* ---------------------------------------------------------------- sorting -- */

function SortingVisual({ spec }: { spec: VisualSpec }) {
  const initial = spec.data ?? DEFAULT_ARRAY;
  const [algorithm, setAlgorithm] = useState<SorterName>((spec.algorithm as SorterName) ?? "bubble");
  const [values, setValues] = useState<number[]>(initial);
  const { frames, summary } = useMemo(() => SORTERS[algorithm].run(values), [algorithm, values]);

  return (
    <VisualPlayer
      key={`${algorithm}-${values.join(",")}`}
      frames={frames}
      summary={summary}
      title={spec.title ?? SORTERS[algorithm].label}
      controls={
        <>
          {spec.lockAlgorithm ? null : (
            <Picker label="Algorithm" value={algorithm} onChange={setAlgorithm}
              options={(Object.keys(SORTERS) as SorterName[]).map((id) => ({ id, label: SORTERS[id].label }))} />
          )}
          <ShuffleButton onClick={() => setValues(randomValues(initial.length))} />
        </>
      }
    >
      {(frame) => draw(frame)}
    </VisualPlayer>
  );
}

/* -------------------------------------------------------------- searching -- */

function SearchingVisual({ spec }: { spec: VisualSpec }) {
  const initial = spec.data ?? DEFAULT_SORTED;
  const [algorithm, setAlgorithm] = useState<SearcherName>((spec.algorithm as SearcherName) ?? "binary");
  const [values, setValues] = useState<number[]>([...initial].sort((a, b) => a - b));
  // Deliberately not the midpoint: binary search would find that on its first
  // look and the animation would be over before it showed anything.
  const [target, setTarget] = useState<number>(spec.target ?? initial[initial.length - 2]);
  const { frames, summary } = useMemo(
    () => SEARCHERS[algorithm].run(values, target), [algorithm, values, target]);

  return (
    <VisualPlayer
      key={`${algorithm}-${target}-${values.join(",")}`}
      frames={frames}
      summary={summary}
      title={spec.title ?? SEARCHERS[algorithm].label}
      controls={
        <>
          {spec.lockAlgorithm ? null : (
            <Picker label="Algorithm" value={algorithm} onChange={setAlgorithm}
              options={(Object.keys(SEARCHERS) as SearcherName[]).map((id) => ({ id, label: SEARCHERS[id].label }))} />
          )}
          <label className="flex items-center gap-1.5 text-xs text-muted">
            target
            <select value={target} onChange={(e) => setTarget(Number(e.target.value))}
              className="cursor-pointer rounded-md border border-border bg-background px-2 py-1 font-mono text-xs text-foreground">
              {values.map((v) => <option key={v} value={v}>{v}</option>)}
              <option value={missingTarget(values)}>not present</option>
            </select>
          </label>
          <ShuffleButton onClick={() => setValues(randomValues(initial.length).sort((a, b) => a - b))} />
        </>
      }
    >
      {(frame) => draw(frame)}
    </VisualPlayer>
  );
}

/* ------------------------------------------------------------- structures -- */

type StructureKind = Exclude<
  VisualKind,
  "sorting" | "searching" | "graph" | "dp" | "string-matching" | "pattern" | "tree-algorithm"
>;

const STRUCTURE_TITLE: Record<StructureKind, string> = {
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

function runStructure(kind: StructureKind, spec: VisualSpec, seed: number): Visualisation {
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

function StructureVisual({ spec, kind }: { spec: VisualSpec; kind: StructureKind }) {
  const [seed, setSeed] = useState(0);
  const { frames, summary } = useMemo(() => runStructure(kind, spec, seed), [kind, spec, seed]);
  const reshuffle = kind === "bst" || kind === "heap";

  return (
    <VisualPlayer
      key={`${kind}-${seed}`}
      frames={frames}
      summary={summary}
      title={spec.title ?? STRUCTURE_TITLE[kind]}
      controls={reshuffle ? <ShuffleButton onClick={() => setSeed((s) => s + 1)} /> : undefined}
    >
      {(frame) => draw(frame)}
    </VisualPlayer>
  );
}
