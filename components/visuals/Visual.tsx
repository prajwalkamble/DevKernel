"use client";

import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import type { VisualSpec } from "@/content/types";
import type { Frame, Visualisation } from "@/lib/visuals/types";
import { SORTERS, type SorterName } from "@/lib/visuals/sorting";
import { SEARCHERS, type SearcherName } from "@/lib/visuals/searching";
import {
  DEFAULT_ARRAY, DEFAULT_SORTED, FAMILIES, STRUCTURE_TITLE, missingTarget, randomValues,
  runStructure, type StructureKind,
} from "@/lib/visuals/resolve";
import { VisualPlayer } from "./VisualPlayer";
import {
  ArrayCanvas, BucketCanvas, FileTreeCanvas, GraphCanvas, HeapCanvas, MatrixCanvas, SequenceCanvas,
  TreeCanvas,
} from "./canvases";

function draw(frame: Frame) {
  switch (frame.kind) {
    case "array": return <ArrayCanvas frame={frame} />;
    case "heap": return <HeapCanvas frame={frame} />;
    case "tree": return <TreeCanvas frame={frame} />;
    case "sequence": return <SequenceCanvas frame={frame} />;
    case "buckets": return <BucketCanvas frame={frame} />;
    case "graph": return <GraphCanvas frame={frame} />;
    case "matrix": return <MatrixCanvas frame={frame} />;
    case "filetree": return <FileTreeCanvas frame={frame} />;
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
    case "graph": return <FamilyVisual spec={spec} {...FAMILIES.graph} />;
    case "dp": return <FamilyVisual spec={spec} {...FAMILIES.dp} />;
    case "string-matching": return <FamilyVisual spec={spec} {...FAMILIES["string-matching"]} />;
    case "pattern": return <FamilyVisual spec={spec} {...FAMILIES.pattern} />;
    case "tree-algorithm": return <FamilyVisual spec={spec} {...FAMILIES["tree-algorithm"]} />;
    case "bits-and-math": return <FamilyVisual spec={spec} {...FAMILIES["bits-and-math"]} />;
    case "react-rendering": return <FamilyVisual spec={spec} {...FAMILIES["react-rendering"]} />;
    case "react-structure": return <FamilyVisual spec={spec} {...FAMILIES["react-structure"]} />;
    case "react-concurrent": return <FamilyVisual spec={spec} {...FAMILIES["react-concurrent"]} />;
    case "react-server": return <FamilyVisual spec={spec} {...FAMILIES["react-server"]} />;
    case "react-tooling": return <FamilyVisual spec={spec} {...FAMILIES["react-tooling"]} />;
    case "react-patterns": return <FamilyVisual spec={spec} {...FAMILIES["react-patterns"]} />;
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
