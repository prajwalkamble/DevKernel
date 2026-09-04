"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { TRACK_BADGE_CLASS } from "@/lib/trackTheme";
import { Tooltip } from "../Tooltip";
import {
  Card,
  Empty,
  HEAT_STEPS,
  HeatLegend,
  formatMinutes,
  heatFill,
  percent,
  plural,
} from "../parts";
import type { ModuleProgress, TrackProgress } from "../progress";

/** Which of the ramp's steps a fraction lands on. Zero is drawn as an outline. */
function stepFor(done: number, total: number): number | null {
  if (total === 0 || done === 0) return null;
  const index = Math.min(
    HEAT_STEPS.length - 1,
    Math.floor((done / total) * HEAT_STEPS.length - 1e-9)
  );
  return HEAT_STEPS[index];
}

function Cell({ entry, mp }: { entry: TrackProgress; mp: ModuleProgress }) {
  const planned = mp.total === 0;
  const step = stepFor(mp.done, mp.total);

  return (
    <Tooltip
      className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      label={
        <>
          <span className="block font-semibold text-foreground">{mp.mod.title}</span>
          <span className="block text-muted">{entry.track.title}</span>
          {planned ? (
            <span className="mt-1 block text-muted">
              No lessons written yet
              {mp.mod.plannedTopics > 0 &&
                ` — ${plural(mp.mod.plannedTopics, "topic")} published`}
            </span>
          ) : (
            <>
              <span className="mt-1 block text-muted">
                {mp.done} of {plural(mp.total, "lesson")} — {percent(mp.done, mp.total)}%
              </span>
              <span className="block text-muted">
                {formatMinutes(mp.minutesDone)} of {formatMinutes(mp.minutesTotal)}
              </span>
            </>
          )}
        </>
      }
    >
      <span
        className={clsx(
          "block h-6 w-6 rounded",
          planned && "border border-dashed border-border",
          !planned && step === null && "border border-border bg-surface-hover"
        )}
        style={step !== null ? { backgroundColor: heatFill(step) } : undefined}
      />
    </Tooltip>
  );
}

/**
 * Every module in the curriculum, one square each, shaded by how much of it is
 * done.
 *
 * A grid comparing magnitude wants one hue light-to-dark, so the ramp is the
 * app accent for every track rather than each track's own — see `heatFill`.
 * Identity comes from the row the square sits in, which is labelled.
 */
export function ModulesView({ entries }: { entries: TrackProgress[] }) {
  const [onlyStarted, setOnlyStarted] = useState(true);

  const rows = useMemo(() => {
    const withLessons = entries.filter((e) => e.track.liveModules > 0);
    return onlyStarted ? withLessons.filter((e) => e.done > 0) : withLessons;
  }, [entries, onlyStarted]);

  return (
    <div className="space-y-5">
      <Card
        title="Module coverage"
        subtitle="One square per module, shaded by how much of it you have finished"
        action={
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
            <input
              type="checkbox"
              checked={onlyStarted}
              onChange={(e) => setOnlyStarted(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border accent-[var(--accent)]"
            />
            Started only
          </label>
        }
      >
        <HeatLegend max="all of it" />

        {rows.length === 0 ? (
          <div className="mt-4">
            <Empty>
              Nothing started yet. Untick “Started only” to see every track&apos;s modules.
            </Empty>
          </div>
        ) : (
          <ul className="mt-5 space-y-5">
            {rows.map((entry) => (
              <li key={entry.track.slug}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={clsx(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        TRACK_BADGE_CLASS[entry.track.accent]
                      )}
                    >
                      {entry.track.shortTitle}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {entry.track.title}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {entry.modulesFinished} finished · {entry.modulesTouched} started ·{" "}
                    {entry.track.totalModules} total
                  </span>
                </div>
                {/* Wraps rather than scrolls: 37 modules at 24px each is four
                    rows on a phone and one on a laptop, and a wrapped grid
                    stays comparable across tracks where a scroller does not. */}
                <div className="flex flex-wrap gap-1">
                  {entry.modules.map((mp) => (
                    <Cell key={mp.mod.slug} entry={entry} mp={mp} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs text-muted">
        A dashed square is a module whose lessons are still being written; its syllabus is
        published and its topics are listed on the module page.
      </p>
    </div>
  );
}
