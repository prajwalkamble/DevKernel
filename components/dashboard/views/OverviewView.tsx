"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Layers, Trophy } from "lucide-react";
import clsx from "clsx";
import { lessonHref } from "@/content/tracks/href";
import { TRACK_BADGE_CLASS } from "@/lib/trackTheme";
import { Tooltip } from "../Tooltip";
import {
  BarRow,
  Card,
  Empty,
  Hero,
  StatTile,
  formatMinutes,
  percent,
  plural,
  trackColor,
} from "../parts";
import type { Totals, TrackProgress } from "../progress";
import type { DashboardProblem } from "../types";

/**
 * How the completed lessons split across tracks.
 *
 * A horizontal stacked bar, because part-to-whole with long category names goes
 * horizontal — and it ships with a labelled legend directly underneath rather
 * than relying on the segment colours, which do not separate reliably enough to
 * carry identity on their own (see `trackColor`). Read the legend, not the bar.
 */
function SplitBar({ entries, total }: { entries: TrackProgress[]; total: number }) {
  if (total <= 0) return null;

  return (
    <div>
      <div className="flex h-3 w-full gap-0.5" role="presentation">
        {entries.map((entry) => (
          <Tooltip
            key={entry.track.slug}
            className="h-full min-w-[6px] rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            // Proportional, but never thinner than that min-width: a track with
            // one lesson in it still has to be a target you can hit.
            style={{ flexGrow: entry.done, flexBasis: 0 }}
            label={
              <>
                <span className="block font-semibold text-foreground">{entry.track.title}</span>
                <span className="block text-muted">
                  {plural(entry.done, "lesson")} — {percent(entry.done, total)}% of everything you
                  have finished
                </span>
                <span className="block text-muted">
                  {formatMinutes(entry.minutesDone)} of reading
                </span>
              </>
            }
          >
            <span
              className="block h-full w-full rounded-full"
              style={{ backgroundColor: trackColor(entry.track.accent) }}
            />
          </Tooltip>
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {entries.map((entry) => (
          <li key={entry.track.slug} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: trackColor(entry.track.accent) }}
            />
            <span className="text-foreground">{entry.track.shortTitle}</span>
            <span className="tabular-nums text-muted">{entry.done}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OverviewView({
  entries,
  started,
  totals,
  problems,
  solved,
  onSeeAll,
}: {
  entries: TrackProgress[];
  started: TrackProgress[];
  totals: Totals;
  problems: DashboardProblem[];
  solved: Set<string>;
  onSeeAll: () => void;
}) {
  const solvedCount = problems.filter((p) => solved.has(p.slug)).length;
  const top = started.slice(0, 5);
  const resume = started[0];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatTile
          icon={<Layers className="h-5 w-5" />}
          label="Tracks started"
          value={String(started.length)}
          detail={`of ${entries.length} in the curriculum`}
        />
        <StatTile
          icon={<BookOpen className="h-5 w-5" />}
          label="Lessons done"
          value={String(totals.done)}
          detail={`of ${totals.lessons} written so far`}
        />
        <StatTile
          icon={<Clock className="h-5 w-5" />}
          label="Time invested"
          value={formatMinutes(totals.minutesDone)}
          detail={`of ${formatMinutes(totals.minutes)} on offer`}
        />
        <StatTile
          icon={<Trophy className="h-5 w-5" />}
          label="Problems solved"
          value={String(solvedCount)}
          detail={`of ${problems.length} in the practice set`}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 items-start lg:grid-cols-3">
        <Card className="lg:col-span-1" title="Overall">
          <Hero
            value={`${percent(totals.done, totals.lessons)}%`}
            caption={`${totals.done} of ${plural(totals.lessons, "live lesson")} complete`}
            done={totals.done}
            total={totals.lessons}
            meterLabel="Curriculum"
          />
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
            <div>
              <dt className="text-xs text-muted">Modules started</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                {totals.modulesTouched}
                <span className="ml-1 text-xs font-normal text-muted">
                  of {totals.liveModules}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Modules finished</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                {totals.modulesFinished}
              </dd>
            </div>
          </dl>
        </Card>

        <Card
          className="lg:col-span-2"
          title="Where your time has gone"
          subtitle={
            totals.done > 0
              ? `${plural(totals.done, "completed lesson")} across ${plural(started.length, "track")}`
              : "Nothing completed yet"
          }
        >
          {totals.done > 0 ? (
            <SplitBar entries={started} total={totals.done} />
          ) : (
            <Empty>
              Mark a lesson complete and this fills in. Every lesson has the button at the bottom.
            </Empty>
          )}

          {resume && resume.next && (
            <div className="mt-6 rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Pick up in {resume.track.title}
              </p>
              <Link
                href={lessonHref(
                  resume.track.slug,
                  resume.next.moduleSlug,
                  resume.next.lesson.slug
                )}
                className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                <span className="truncate">{resume.next.lesson.title}</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
              <p className="mt-1 text-xs text-muted">
                The first lesson you have not marked complete, in curriculum order.
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Tracks in progress"
        subtitle="Share of each track's live lessons"
        action={
          <button
            type="button"
            onClick={onSeeAll}
            className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            All tracks
          </button>
        }
        bodyClassName="p-2 sm:p-3"
      >
        {top.length > 0 ? (
          <div className="space-y-1">
            {top.map((entry) => (
              <BarRow
                key={entry.track.slug}
                name={entry.track.title}
                badge={
                  <span
                    className={clsx(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                      TRACK_BADGE_CLASS[entry.track.accent]
                    )}
                  >
                    {entry.track.shortTitle}
                  </span>
                }
                value={`${percent(entry.done, entry.track.totalLessons)}%`}
                detail={`${entry.done}/${entry.track.totalLessons}`}
                pct={percent(entry.done, entry.track.totalLessons)}
                fill={trackColor(entry.track.accent)}
                tooltip={
                  <>
                    <span className="block font-semibold text-foreground">
                      {entry.track.title}
                    </span>
                    <span className="block text-muted">
                      {entry.done} of {plural(entry.track.totalLessons, "live lesson")}
                    </span>
                    <span className="block text-muted">
                      {formatMinutes(entry.minutesDone)} of{" "}
                      {formatMinutes(entry.track.totalMinutes)}
                    </span>
                    <span className="block text-muted">
                      {plural(entry.modulesTouched, "module")} started,{" "}
                      {entry.modulesFinished} finished
                    </span>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <div className="p-3">
            <Empty>
              No track started yet.{" "}
              <Link href="/curriculum" className="text-accent hover:underline">
                Browse the curriculum
              </Link>{" "}
              to pick one.
            </Empty>
          </div>
        )}
      </Card>
    </div>
  );
}
