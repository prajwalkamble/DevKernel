"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpDown } from "lucide-react";
import clsx from "clsx";
import { lessonHref, trackHref } from "@/content/tracks/href";
import { TRACK_BADGE_CLASS } from "@/lib/trackTheme";
import { Card, Meter, formatMinutes, percent, plural, trackColor } from "../parts";
import type { TrackProgress } from "../progress";

type SortKey = "progress" | "name" | "lessons" | "time";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "progress", label: "Progress" },
  { key: "name", label: "Name" },
  { key: "lessons", label: "Lessons done" },
  { key: "time", label: "Time invested" },
];

/**
 * Every track, as a table.
 *
 * This is also the page's table view — the accessible counterpart every figure
 * on the other tabs needs, where the numbers behind the bars are plain text and
 * sortable rather than hover-only.
 *
 * Below `sm` the three narrower columns drop out and the meter moves under the
 * name, so the row stays readable on a phone instead of scrolling sideways. The
 * wrapper still has `overflow-x-auto` as a floor, because a long track title in
 * a large font can outgrow any breakpoint plan.
 */
export function TracksView({ entries }: { entries: TrackProgress[] }) {
  const [sort, setSort] = useState<SortKey>("progress");
  const [onlyStarted, setOnlyStarted] = useState(false);

  const rows = useMemo(() => {
    const filtered = onlyStarted ? entries.filter((e) => e.done > 0) : entries;
    const ranked = [...filtered];
    ranked.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.track.title.localeCompare(b.track.title);
        case "lessons":
          return b.done - a.done || a.track.title.localeCompare(b.track.title);
        case "time":
          return b.minutesDone - a.minutesDone || a.track.title.localeCompare(b.track.title);
        default: {
          const share = (e: TrackProgress) =>
            e.track.totalLessons > 0 ? e.done / e.track.totalLessons : -1;
          return share(b) - share(a) || b.done - a.done;
        }
      }
    });
    return ranked;
  }, [entries, sort, onlyStarted]);

  return (
    <Card
      title="All tracks"
      subtitle={`${plural(rows.length, "track")} shown`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input
              type="checkbox"
              checked={onlyStarted}
              onChange={(e) => setOnlyStarted(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border accent-[var(--accent)]"
            />
            Started only
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only sm:not-sr-only">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      }
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 text-sm">
          <caption className="sr-only">
            Every track, with lessons completed, time invested and modules touched.
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">
                Track
              </th>
              <th scope="col" className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">
                Lessons
              </th>
              <th scope="col" className="hidden px-4 py-2.5 text-right font-medium md:table-cell">
                Time
              </th>
              <th scope="col" className="hidden px-4 py-2.5 text-right font-medium lg:table-cell">
                Modules
              </th>
              <th
                scope="col"
                className="hidden px-4 py-2.5 text-right font-medium sm:table-cell sm:px-5"
              >
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => {
              const pct = percent(entry.done, entry.track.totalLessons);
              const live = entry.track.totalLessons > 0;
              return (
                <tr
                  key={entry.track.slug}
                  className="border-b border-border last:border-0 hover:bg-surface-hover"
                >
                  <th scope="row" className="px-4 py-3 text-left font-normal sm:px-5">
                    <Link
                      href={trackHref(entry.track.slug)}
                      className="flex min-w-0 items-center gap-2"
                    >
                      <span
                        className={clsx(
                          "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                          TRACK_BADGE_CLASS[entry.track.accent]
                        )}
                      >
                        {entry.track.shortTitle}
                      </span>
                      <span className="truncate font-medium text-foreground">
                        {entry.track.title}
                      </span>
                    </Link>
                    {/* The columns that drop out below sm come back here, so a
                        phone loses the grid and not the numbers. */}
                    <span className="mt-1 block text-xs tabular-nums text-muted sm:hidden">
                      {live
                        ? `${entry.done}/${entry.track.totalLessons} lessons · ${formatMinutes(entry.minutesDone)} · ${pct}%`
                        : `Syllabus only · ${plural(entry.track.plannedTopics, "topic")}`}
                    </span>
                  </th>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-muted sm:table-cell">
                    {live ? (
                      <>
                        <span className="font-medium text-foreground">{entry.done}</span>
                        <span className="text-muted"> / {entry.track.totalLessons}</span>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-muted md:table-cell">
                    {live ? formatMinutes(entry.minutesDone) : "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-muted lg:table-cell">
                    {live ? (
                      <>
                        <span className="font-medium text-foreground">
                          {entry.modulesTouched}
                        </span>
                        <span className="text-muted"> / {entry.track.liveModules}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell sm:px-5">
                    <div className="ml-auto w-36">
                      {live ? (
                        <Meter
                          pct={pct}
                          fill={trackColor(entry.track.accent)}
                          size="sm"
                          right={`${pct}%`}
                        />
                      ) : (
                        <p className="text-right text-xs text-muted">Not written</p>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="px-5 py-8 text-center text-sm text-muted">
          No track has a completed lesson yet. Untick “Started only” to see them all.
        </p>
      )}

      {rows.some((entry) => entry.next) && (
        <div className="border-t border-border px-4 py-3 sm:px-5">
          <p className="text-xs text-muted">
            Next unfinished lesson in your furthest track:{" "}
            {(() => {
              const first = rows.find((entry) => entry.done > 0 && entry.next);
              if (!first || !first.next) return "you have finished every one.";
              return (
                <Link
                  href={lessonHref(
                    first.track.slug,
                    first.next.moduleSlug,
                    first.next.lesson.slug
                  )}
                  className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                >
                  {first.next.lesson.title}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              );
            })()}
          </p>
        </div>
      )}
    </Card>
  );
}
