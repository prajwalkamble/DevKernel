"use client";

import clsx from "clsx";
import type {
  ArrayFrame,
  BucketFrame,
  GraphFrame,
  HeapFrame,
  MatrixFrame,
  SequenceFrame,
  TreeFrame,
} from "@/lib/visuals/types";
import { ROLE_FILL, ROLE_RING, ROLE_STROKE, ROLE_SVG_FILL, ROLE_TEXT } from "./roles";

/**
 * Every drawing is fitted into a viewport of bounded height.
 *
 * Two failures to avoid, and they pull in opposite directions. Told only to
 * fill its container, an SVG blows a four-node tree up to the width of the
 * page. Given no cap, a deep trie or a big graph grows until the reader has to
 * scroll to see the end of it — which defeats the point, because the whole
 * value of an animation is watching the *whole* thing change at once.
 *
 * So: the viewBox is padded to a minimum so small drawings are not magnified,
 * the rendered height is clamped between MIN and MAX, and
 * `preserveAspectRatio="xMidYMid meet"` scales the content down to fit
 * whatever is left. Nothing ever overflows and nothing ever needs scrolling.
 */
const MIN_VIEW = 150;
const MAX_VIEW = 300;
const SCALE = 1.7;

/** The rendered height for a drawing whose natural size is `w × h`. */
function fitted(w: number, h: number) {
  const natural = h * SCALE;
  return {
    height: Math.round(Math.min(MAX_VIEW, Math.max(MIN_VIEW, natural))),
    viewBox: `0 0 ${Math.max(w, 120)} ${Math.max(h, 80)}`,
  };
}

/**
 * The starting state of a structure that is built up from nothing.
 *
 * Several of these begin empty, which is pedagogically right — you watch it
 * being built — but a tall blank box reads as a broken widget. This is short,
 * dashed, and says what to do next.
 */
function EmptyState() {
  return (
    <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border">
      <p className="text-sm text-muted">
        Nothing here yet — press <span className="font-medium text-foreground">Play</span> to build it
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ arrays -- */

/**
 * Bars for an array, height proportional to value.
 *
 * The value is printed under every bar as well as encoded in its height, so
 * the picture is readable at small sizes and by anyone who cannot compare the
 * heights precisely. Bars are laid out with flex rather than absolute
 * positions, which keeps the whole thing responsive without measuring.
 */
export function ArrayCanvas({ frame }: { frame: ArrayFrame }) {
  const max = Math.max(1, ...frame.values);
  return (
    <div className="space-y-1">
      <div className="flex h-40 items-end gap-1" role="img"
        aria-label={`Array of ${frame.values.length} values. ${frame.note}`}>
        {frame.values.map((value, i) => {
          const role = frame.roles[i];
          return (
            <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1">
              {/* The bar sits in its own flex-1 box so that its percentage
                  height resolves against a definite size — a percentage on a
                  height:auto parent computes to nothing, which is exactly the
                  bug this structure avoids. */}
              <div className="flex w-full flex-1 items-end">
                <div
                  className={clsx(
                    "w-full rounded-t-sm transition-all duration-200",
                    role ? ROLE_FILL[role] : "bg-muted/40"
                  )}
                  style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
                />
              </div>
              <span className={clsx("shrink-0 font-mono text-[10px] tabular-nums",
                role ? ROLE_TEXT[role] : "text-muted")}>
                {value}
              </span>
            </div>
          );
        })}
      </div>
      {frame.markers && Object.keys(frame.markers).length > 0 && (
        <div className="flex gap-1">
          {frame.values.map((_, i) => (
            <div key={i} className="min-w-0 flex-1 text-center font-mono text-[10px] text-accent">
              {frame.markers?.[i] ?? ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- heaps -- */

/**
 * A heap drawn twice — as the array it is and as the tree it behaves like —
 * because the whole idea of a binary heap is that those are the same object.
 */
export function HeapCanvas({ frame }: { frame: HeapFrame }) {
  if (frame.values.length === 0) {
    return <EmptyState />;
  }
  const depth = Math.floor(Math.log2(frame.values.length)) + 1;
  const width = Math.max(1, 2 ** (depth - 1));
  const rowHeight = 56;

  return (
    <div className="space-y-4">
      <svg
        {...fitted(width * 64, Math.max(1, depth) * rowHeight)}
        preserveAspectRatio="xMidYMid meet"
        className="mx-auto block w-full"
        role="img"
        aria-label={`Heap with ${frame.values.length} values. ${frame.note}`}
      >
        {frame.values.map((_, i) => {
          if (i === 0) return null;
          const parent = Math.floor((i - 1) / 2);
          const a = nodePosition(i, width);
          const b = nodePosition(parent, width);
          return (
            <line key={`e${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              className="stroke-border" strokeWidth={1.5} />
          );
        })}
        {frame.values.map((value, i) => {
          const { x, y } = nodePosition(i, width);
          const role = frame.roles[i];
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={15}
                className={clsx(role ? ROLE_SVG_FILL[role] : "fill-surface", "stroke-border")}
                strokeWidth={1.5} />
              <text x={x} y={y + 4} textAnchor="middle"
                className={clsx("fill-foreground font-mono text-[11px]",
                  role && "fill-white dark:fill-black")}>
                {value}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-1">
        {frame.values.map((value, i) => {
          const role = frame.roles[i];
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className={clsx(
                "flex h-9 w-9 items-center justify-center rounded border font-mono text-xs",
                role ? `${ROLE_FILL[role]} border-transparent text-white dark:text-black`
                  : "border-border bg-background text-foreground"
              )}>
                {value}
              </div>
              <span className="font-mono text-[10px] text-muted">{i}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Index i sits at depth ⌊log2(i+1)⌋, spread evenly across that row. */
function nodePosition(i: number, width: number) {
  const depth = Math.floor(Math.log2(i + 1));
  const rowStart = 2 ** depth - 1;
  const inRow = i - rowStart;
  const slots = 2 ** depth;
  const cellWidth = (width * 64) / slots;
  return { x: cellWidth * (inRow + 0.5), y: depth * 56 + 26 };
}

/* ------------------------------------------------------------------- trees -- */

export function TreeCanvas({ frame }: { frame: TreeFrame }) {
  if (frame.nodes.length === 0) {
    return <EmptyState />;
  }
  const maxX = Math.max(...frame.nodes.map((n) => n.x));
  const maxDepth = Math.max(...frame.nodes.map((n) => n.depth));
  const colWidth = 54;
  const rowHeight = 62;
  const width = (maxX + 1) * colWidth;
  const height = (maxDepth + 1) * rowHeight;
  const at = (n: { x: number; depth: number }) => ({
    x: n.x * colWidth + colWidth / 2,
    y: n.depth * rowHeight + 24,
  });
  const byId = new Map(frame.nodes.map((n) => [n.id, n]));

  return (
    <svg
      {...fitted(width, height)}
      preserveAspectRatio="xMidYMid meet"
      className="mx-auto block w-full"
      role="img" aria-label={frame.note}>
      {frame.nodes.map((node) => {
        const parent = node.parent ? byId.get(node.parent) : undefined;
        if (!parent) return null;
        const a = at(node);
        const b = at(parent);
        return <line key={`e-${node.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          className="stroke-border" strokeWidth={1.5} />;
      })}
      {frame.nodes.map((node) => {
        const { x, y } = at(node);
        return (
          <g key={node.id}>
            {/* A second ring marks a trie node that completes a word. */}
            {node.terminal && (
              <circle cx={x} cy={y} r={19} className="fill-none stroke-accent" strokeWidth={1.5} />
            )}
            <circle cx={x} cy={y} r={15}
              className={clsx(node.role ? ROLE_SVG_FILL[node.role] : "fill-surface", "stroke-border")}
              strokeWidth={1.5} />
            <text x={x} y={y + 4} textAnchor="middle"
              className={clsx("fill-foreground font-mono text-[11px]",
                node.role && "fill-white dark:fill-black")}>
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* --------------------------------------------------------------- sequences -- */

export function SequenceCanvas({ frame }: { frame: SequenceFrame }) {
  if (frame.items.length === 0) {
    return <EmptyState />;
  }
  return (
    <div className="flex flex-wrap items-start gap-1 py-2" role="img" aria-label={frame.note}>
      {frame.items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-1">
          <div className="flex flex-col items-center gap-1">
            <span className="h-4 font-mono text-[10px] text-accent">{frame.pins?.[i] ?? ""}</span>
            <div className={clsx(
              "flex h-11 min-w-11 items-center justify-center rounded-md border px-2 font-mono text-sm transition-colors",
              item.role
                ? `${ROLE_FILL[item.role]} border-transparent text-white ring-2 ring-offset-1 ring-offset-surface dark:text-black ${ROLE_RING[item.role]}`
                : "border-border bg-background text-foreground"
            )}>
              {item.label}
            </div>
          </div>
          {frame.linked && i < frame.items.length - 1 && (
            <span aria-hidden className="mt-4 text-muted">→</span>
          )}
        </div>
      ))}
      {frame.linked && (
        <span aria-hidden className="mt-9 font-mono text-xs text-muted">→ null</span>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- buckets -- */

export function BucketCanvas({ frame }: { frame: BucketFrame }) {
  return (
    <div className="space-y-1.5" role="img" aria-label={frame.note}>
      {frame.buckets.map((bucket) => (
        <div key={bucket.key} className="flex items-center gap-2">
          <div className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded border font-mono text-xs",
            bucket.role ? `${ROLE_FILL[bucket.role]} border-transparent text-white dark:text-black`
              : "border-border bg-background text-muted"
          )}>
            {bucket.key}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            {bucket.items.length === 0 ? (
              <span className="font-mono text-xs text-muted">—</span>
            ) : (
              bucket.items.map((item, i) => (
                <span key={item} className="flex items-center gap-1">
                  {i > 0 && <span aria-hidden className="text-muted">→</span>}
                  <span className="rounded border border-border bg-surface-hover px-2 py-0.5 font-mono text-xs text-foreground">
                    {item}
                  </span>
                </span>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ graphs -- */

/**
 * A graph with fixed node positions.
 *
 * The layout comes from the generator and never changes between frames — a
 * graph whose nodes drift is unreadable, because the eye spends its effort
 * re-finding them instead of following the algorithm.
 */
export function GraphCanvas({ frame }: { frame: GraphFrame }) {
  const pad = 34;
  const width = Math.max(...frame.nodes.map((n) => n.x)) + pad * 2;
  const height = Math.max(...frame.nodes.map((n) => n.y)) + pad * 2;
  const at = (id: string) => {
    const n = frame.nodes.find((x) => x.id === id)!;
    return { x: n.x + pad, y: n.y + pad };
  };
  const long = frame.nodes.some((n) => n.label.length > 3);

  return (
    <div className="space-y-3">
      <svg
        {...fitted(width, height)}
        preserveAspectRatio="xMidYMid meet"
        className="mx-auto block w-full"
        role="img"
        aria-label={frame.note}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="20" refY="5"
            markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted" />
          </marker>
        </defs>
        {frame.edges.map((edge, i) => {
          const a = at(edge.from);
          const b = at(edge.to);
          return (
            <g key={`${edge.from}-${edge.to}-${i}`}>
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                className={clsx(edge.role ? ROLE_STROKE[edge.role] : "stroke-border")}
                strokeWidth={edge.role ? 3 : 1.5}
                markerEnd={edge.directed ? "url(#arrow)" : undefined}
              />
              {edge.weight !== undefined && (
                <text
                  x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4}
                  textAnchor="middle"
                  className="fill-muted font-mono text-[9px]"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          );
        })}
        {frame.nodes.map((node) => {
          const { x, y } = at(node.id);
          return (
            <g key={node.id}>
              <circle cx={x} cy={y} r={long ? 24 : 16}
                className={clsx(node.role ? ROLE_SVG_FILL[node.role] : "fill-surface", "stroke-border")}
                strokeWidth={1.5} />
              <text x={x} y={y + 3} textAnchor="middle"
                className={clsx("fill-foreground font-mono", long ? "text-[8px]" : "text-[11px]",
                  node.role && "fill-white dark:fill-black")}>
                {node.label}
              </text>
              {node.badge !== undefined && (
                <text x={x} y={y + (long ? 36 : 30)} textAnchor="middle"
                  className="fill-accent font-mono text-[9px]">
                  {node.badge}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {frame.output && frame.output.length > 0 && (
        <p className="text-center font-mono text-xs text-muted">
          order: <span className="text-foreground">{frame.output.join(" → ")}</span>
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- matrices -- */

/** A DP table, a distance matrix, or two aligned strings. */
export function MatrixCanvas({ frame }: { frame: MatrixFrame }) {
  const wide = frame.rowLabels?.some((l) => l.length > 4);
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="mx-auto border-separate border-spacing-0.5 font-mono text-xs">
        {frame.colLabels && (
          <thead>
            <tr>
              {frame.rowLabels && <th className="px-1" />}
              {frame.colLabels.map((label, c) => (
                <th key={c} className="px-1 pb-0.5 text-center font-normal text-muted">{label}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {frame.cells.map((row, r) => (
            <tr key={r}>
              {frame.rowLabels && (
                <th className={clsx("pr-1.5 text-right font-normal text-muted", wide && "whitespace-nowrap")}>
                  {frame.rowLabels[r]}
                </th>
              )}
              {row.map((cell, c) => {
                const role = frame.roles[`${r},${c}`];
                return (
                  <td
                    key={c}
                    className={clsx(
                      "h-7 min-w-7 rounded border px-1.5 text-center transition-colors",
                      role
                        ? `${ROLE_FILL[role]} border-transparent text-white dark:text-black`
                        : cell === ""
                          ? "border-dashed border-border bg-transparent text-muted"
                          : "border-border bg-background text-foreground"
                    )}
                  >
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
