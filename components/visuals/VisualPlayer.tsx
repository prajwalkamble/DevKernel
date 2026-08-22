"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import type { Frame, Role } from "@/lib/visuals/types";
import { ROLE_FILL, ROLE_LABEL } from "./roles";

const SPEEDS = [
  { label: "0.5×", ms: 1200 },
  { label: "1×", ms: 600 },
  { label: "2×", ms: 280 },
  { label: "4×", ms: 120 },
];

/**
 * The shell every visualisation shares: transport controls, a scrubber, the
 * current step's sentence, and the running tallies.
 *
 * The frames are precomputed, so stepping backwards is just an index change
 * rather than a replay — which is the thing that makes these useful for
 * studying rather than only for watching. Playback stops at the end instead of
 * looping, because a loop restarts the explanation mid-thought.
 */
export function VisualPlayer({
  frames,
  summary,
  title,
  controls,
  children,
}: {
  frames: Frame[];
  summary?: string;
  title?: string;
  /** Extra inputs — algorithm pickers, "shuffle", and so on. */
  controls?: ReactNode;
  children: (frame: Frame, index: number) => ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const last = Math.max(0, frames.length - 1);
  const clamped = Math.min(index, last);
  const frame = frames[clamped];
  const atEnd = clamped >= last;

  // Resetting for a new run is the caller's job: `Visual` gives the player a
  // `key` derived from the run, so a different algorithm or a reshuffle
  // remounts it at frame zero. That is React's own answer to "reset state when
  // a prop changes", and it avoids a setState inside an effect.
  //
  // Reaching the last frame does not clear `playing` either — the effect
  // simply stops scheduling. Keeping the flag means pressing Replay at the end
  // resumes playing rather than requiring a second click.
  //
  // `clamped` must stay in the dependency list. Each tick schedules exactly one
  // advance, so it is arriving at a new frame that arms the timer for the frame
  // after it. Drop it and the effect never re-runs, the chain is never
  // re-armed, and playback advances a single step and stalls.
  useEffect(() => {
    if (!playing || atEnd) return;
    const id = setTimeout(
      () => setIndex(Math.min(last, clamped + 1)),
      SPEEDS[speed].ms
    );
    return () => clearTimeout(id);
  }, [playing, atEnd, speed, clamped, last]);

  const step = useCallback(
    (by: number) => {
      setPlaying(false);
      setIndex((i) => Math.max(0, Math.min(last, i + by)));
    },
    [last]
  );

  const restart = useCallback(() => {
    setIndex(0);
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
      else if (event.key === " ") { event.preventDefault(); setPlaying((p) => !p); }
      else if (event.key === "Home") { event.preventDefault(); setPlaying(false); restart(); }
      else if (event.key === "End") { event.preventDefault(); setPlaying(false); setIndex(last); }
    },
    [step, restart, last]
  );

  if (!frame) return null;

  const usedRoles = collectRoles(frames);

  return (
    <figure
      className="not-prose my-6 overflow-hidden rounded-xl border border-border bg-surface"
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="group"
      aria-label={title ? `${title} visualization` : "Visualization"}
    >
      {(title || controls) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
          {controls && <div className="flex flex-wrap items-center gap-2">{controls}</div>}
        </div>
      )}

      <div className="px-4 py-5">{children(frame, clamped)}</div>

      {/* The sentence for the current step. `aria-live` announces it as the
          animation runs, so the visualisation is followable without seeing it. */}
      <p
        aria-live="polite"
        className="min-h-[2.75rem] border-t border-border bg-background px-4 py-2.5 text-sm leading-relaxed text-foreground/85"
      >
        {frame.note}
      </p>

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2">
        <button
          type="button"
          onClick={() => {
            if (atEnd) { setIndex(0); setPlaying(true); }
            else setPlaying((p) => !p);
          }}
          className="flex cursor-pointer items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          {atEnd ? <RotateCcw className="h-3.5 w-3.5" />
            : playing ? <Pause className="h-3.5 w-3.5" />
              : <Play className="h-3.5 w-3.5" />}
          {atEnd ? "Replay" : playing ? "Pause" : "Play"}
        </button>

        <button type="button" onClick={() => step(-1)} disabled={clamped === 0}
          aria-label="Previous step"
          className="cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:cursor-default disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => step(1)} disabled={clamped >= last}
          aria-label="Next step"
          className="cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:cursor-default disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>

        <input
          type="range"
          min={0}
          max={last}
          value={clamped}
          onChange={(e) => { setPlaying(false); setIndex(Number(e.target.value)); }}
          aria-label="Step through the visualization"
          className="h-1 min-w-0 flex-1 cursor-pointer accent-accent"
        />

        <span className="shrink-0 font-mono text-xs text-muted">
          {clamped + 1}/{frames.length}
        </span>

        <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-border p-0.5">
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setSpeed(i)}
              className={clsx(
                "cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors",
                i === speed ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {(usedRoles.length > 0 || frame.stats) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border px-4 py-2 text-xs">
          {usedRoles.map((role) => (
            <span key={role} className="flex items-center gap-1.5 text-muted">
              <span className={clsx("h-2.5 w-2.5 rounded-sm", ROLE_FILL[role])} aria-hidden />
              {ROLE_LABEL[role]}
            </span>
          ))}
          {frame.stats && Object.entries(frame.stats).map(([name, value]) => (
            <span key={name} className="font-mono text-muted">
              {name}: <span className="text-foreground">{value}</span>
            </span>
          ))}
        </div>
      )}

      {summary && (
        <figcaption className="border-t border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground/75">
          {summary}
        </figcaption>
      )}
    </figure>
  );
}

/** Which roles this run actually uses, so the legend shows nothing spurious. */
function collectRoles(frames: Frame[]): Role[] {
  const seen = new Set<Role>();
  for (const frame of frames) {
    if (frame.kind === "array" || frame.kind === "heap") {
      for (const role of Object.values(frame.roles)) seen.add(role);
    } else if (frame.kind === "tree") {
      for (const node of frame.nodes) if (node.role) seen.add(node.role);
    } else if (frame.kind === "sequence") {
      for (const item of frame.items) if (item.role) seen.add(item.role);
    } else if (frame.kind === "buckets") {
      for (const bucket of frame.buckets) if (bucket.role) seen.add(bucket.role);
    } else if (frame.kind === "graph") {
      for (const node of frame.nodes) if (node.role) seen.add(node.role);
      for (const edge of frame.edges) if (edge.role) seen.add(edge.role);
    } else {
      for (const role of Object.values(frame.roles)) seen.add(role);
    }
  }
  const order: Role[] = ["compare", "swap", "pivot", "active", "window", "discarded", "sorted", "found"];
  return order.filter((r) => seen.has(r));
}
