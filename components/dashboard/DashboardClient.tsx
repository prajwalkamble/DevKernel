"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Layers, Sparkles } from "lucide-react";
import clsx from "clsx";
import { lessonHref, trackHref } from "@/content/tracks/href";
import { TRACK_BADGE_CLASS } from "@/lib/trackTheme";
import { useProgress } from "@/lib/useProgress";
import { Tooltip } from "./Tooltip";
import type { DashboardLesson, DashboardModule, DashboardTrack } from "./types";

/* ---------------------------------------------------------------- numbers */

/**
 * A percentage that never lies at the ends.
 *
 * Rounding alone reports 100% at 525 of 526 and 0% at 1 of 526 — the two
 * readings a progress display must never get wrong, because they are the two
 * the reader acts on. So the ends are exact and everything between them is
 * clamped into 1–99.
 */
function percent(done: number, total: number): number {
  if (total <= 0 || done <= 0) return 0;
  if (done >= total) return 100;
  return Math.min(99, Math.max(1, Math.round((done / total) * 100)));
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/* ------------------------------------------------------------ the reading */

interface ModuleProgress {
  mod: DashboardModule;
  done: number;
  total: number;
  minutesDone: number;
}

interface TrackProgress {
  track: DashboardTrack;
  done: number;
  minutesDone: number;
  modules: ModuleProgress[];
  /** Modules with at least one lesson completed. */
  modulesTouched: number;
  /** The first live lesson not marked complete, in curriculum order. */
  next: { moduleSlug: string; lesson: DashboardLesson } | null;
}

/**
 * Reads progress by walking the curriculum, never by walking the stored set.
 *
 * The direction matters. localStorage holds whatever keys were written, and a
 * lesson that has since been renamed or removed leaves one behind that matches
 * nothing. Counting the stored set would let those inflate a total past its own
 * denominator; asking each real lesson whether it is complete cannot.
 */
function read(tracks: DashboardTrack[], completed: Set<string>): TrackProgress[] {
  return tracks.map((track) => {
    let done = 0;
    let minutesDone = 0;
    let modulesTouched = 0;
    let next: TrackProgress["next"] = null;

    const modules = track.modules.map((mod) => {
      let moduleDone = 0;
      let moduleMinutes = 0;
      for (const lesson of mod.lessons) {
        if (completed.has(`${track.slug}/${mod.slug}/${lesson.slug}`)) {
          moduleDone++;
          moduleMinutes += lesson.estimatedMinutes;
        } else if (next === null) {
          next = { moduleSlug: mod.slug, lesson };
        }
      }
      done += moduleDone;
      minutesDone += moduleMinutes;
      if (moduleDone > 0) modulesTouched++;
      return {
        mod,
        done: moduleDone,
        total: mod.lessons.length,
        minutesDone: moduleMinutes,
      };
    });

    return { track, done, minutesDone, modules, modulesTouched, next };
  });
}

/** How stale keys are counted, and the only place the stored set is walked. */
function countStale(tracks: DashboardTrack[], completed: Set<string>): number {
  const real = new Set<string>();
  for (const track of tracks) {
    for (const mod of track.modules) {
      for (const lesson of mod.lessons) {
        real.add(`${track.slug}/${mod.slug}/${lesson.slug}`);
      }
    }
  }
  let stale = 0;
  for (const key of completed) if (!real.has(key)) stale++;
  return stale;
}

/* ------------------------------------------------------------------ parts */

/** The overall completion ring. */
function Ring({ done, total }: { done: number; total: number }) {
  const pct = percent(done, total);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative h-40 w-40 shrink-0">
      {/* `-rotate-90` puts zero at twelve o'clock; without it the arc starts at
          three and reads as a different quantity than it is. */}
      <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90" aria-hidden>
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="14"
          // `border` rather than `surface-hover`: the ring sits on a `surface`
          // card, and those two differ by about one step of grey, so the track
          // vanished and a small arc read as a stray pill rather than a dial.
          className="stroke-border"
        />
        {/* Omitted entirely at zero. A round cap on a zero-length dash still
            paints a dot, so an untouched curriculum drew a mark that read as
            "you have done a little" — the one thing 0% must not say. */}
        {pct > 0 && (
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            className="stroke-accent transition-[stroke-dasharray] duration-500 motion-reduce:transition-none"
            strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums text-foreground">{pct}%</span>
        <span className="text-xs text-muted">of the live curriculum</span>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  detail,
}: {
  icon: typeof BookOpen;
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-2 flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{detail}</p>
    </div>
  );
}

/**
 * Where the completed lessons sit, one segment per track in the track's colour.
 *
 * This answers a different question from the ring — not how much is done, but
 * how it is spread — so segments are shares of what you have completed, not of
 * the curriculum. Segments below a couple of percent are still given a floor
 * width, or a track with one lesson in it becomes a hairline nobody can hover.
 */
function SplitBar({ entries, total }: { entries: TrackProgress[]; total: number }) {
  if (total <= 0) return null;
  const shown = entries.filter((entry) => entry.done > 0);

  return (
    <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
      {shown.map((entry) => (
        <Tooltip
          key={entry.track.slug}
          className="h-full min-w-[6px] rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          // Proportional, but never thinner than the min-width above: a track
          // with one lesson in it still has to be hoverable.
          style={{ flexGrow: entry.done, flexBasis: 0 }}
          label={
            <>
              <span className="block font-semibold text-foreground">{entry.track.title}</span>
              <span className="block text-muted">
                {plural(entry.done, "lesson")} completed — {percent(entry.done, total)}% of
                everything you have finished
              </span>
              <span className="block text-muted">{formatMinutes(entry.minutesDone)} of reading</span>
            </>
          }
        >
          <span
            className="block h-full w-full rounded-full"
            style={{ backgroundColor: `var(--${entry.track.accent}-color)` }}
          />
        </Tooltip>
      ))}
    </div>
  );
}

/** One square per module, shaded by how much of it is done. */
function ModuleStrip({ entry }: { entry: TrackProgress }) {
  return (
    <div className="flex flex-wrap gap-1">
      {entry.modules.map(({ mod, done, total, minutesDone }) => {
        const planned = total === 0;
        const fraction = total > 0 ? done / total : 0;

        return (
          <Tooltip
            key={mod.slug}
            className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            label={
              <>
                <span className="block font-semibold text-foreground">{mod.title}</span>
                {planned ? (
                  <span className="block text-muted">
                    No lessons written yet
                    {mod.plannedTopics > 0 &&
                      ` — ${plural(mod.plannedTopics, "topic")} published`}
                  </span>
                ) : (
                  <>
                    <span className="block text-muted">
                      {done} of {plural(total, "lesson")} — {percent(done, total)}%
                    </span>
                    <span className="block text-muted">
                      {formatMinutes(minutesDone)} of {formatMinutes(
                        mod.lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0)
                      )}
                    </span>
                  </>
                )}
              </>
            }
          >
            <span
              className={clsx(
                "block h-5 w-5 rounded",
                planned && "border border-dashed border-border",
                !planned && done === 0 && "border border-border bg-surface-hover"
              )}
              style={
                !planned && done > 0
                  ? {
                      backgroundColor: `var(--${entry.track.accent}-color)`,
                      // Never below 0.25, or one completed lesson out of thirty
                      // is indistinguishable from none.
                      opacity: 0.25 + 0.75 * fraction,
                    }
                  : undefined
              }
            />
          </Tooltip>
        );
      })}
    </div>
  );
}

function StartedTrack({ entry }: { entry: TrackProgress }) {
  const { track, done, minutesDone } = entry;
  const pct = percent(done, track.totalLessons);

  return (
    <li className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={clsx(
              "shrink-0 rounded-md px-2 py-1 text-xs font-semibold",
              TRACK_BADGE_CLASS[track.accent]
            )}
          >
            {track.shortTitle}
          </span>
          <Link
            href={trackHref(track.slug)}
            className="truncate font-semibold text-foreground hover:text-accent"
          >
            {track.title}
          </Link>
        </div>
        <p className="shrink-0 text-sm tabular-nums text-muted">
          <span className="font-semibold text-foreground">{done}</span> / {track.totalLessons}{" "}
          lessons
          <span className="mx-2 text-border">|</span>
          <span className="font-semibold text-foreground">{pct}%</span>
        </p>
      </div>

      <Tooltip
        className="mb-4 block w-full cursor-default"
        label={
          <>
            <span className="block font-semibold text-foreground">{track.title}</span>
            <span className="block text-muted">
              {done} of {plural(track.totalLessons, "live lesson")} completed
            </span>
            <span className="block text-muted">
              {formatMinutes(minutesDone)} done of {formatMinutes(track.totalMinutes)}
            </span>
            <span className="block text-muted">
              {plural(entry.modulesTouched, "module")} started of {track.liveModules} live
              {track.totalModules > track.liveModules &&
                `, ${track.totalModules - track.liveModules} still to be written`}
            </span>
          </>
        }
      >
        <span className="block h-2.5 w-full overflow-hidden rounded-full bg-surface-hover">
          <span
            className="block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
            style={{
              width: `${pct}%`,
              backgroundColor: `var(--${track.accent}-color)`,
            }}
          />
        </span>
      </Tooltip>

      <ModuleStrip entry={entry} />

      {entry.next && (
        <Link
          href={lessonHref(track.slug, entry.next.moduleSlug, entry.next.lesson.slug)}
          className="mt-4 inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <span className="truncate">Next unfinished: {entry.next.lesson.title}</span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      )}
      {!entry.next && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-success">
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
          Every live lesson in this track is complete.
        </p>
      )}
    </li>
  );
}

function NotStartedTrack({ entry }: { entry: TrackProgress }) {
  const { track } = entry;
  const live = track.totalLessons > 0;

  return (
    <li>
      <Link
        href={trackHref(track.slug)}
        className="flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/50 hover:bg-surface-hover"
      >
        <span
          className={clsx(
            "w-fit rounded-md px-2 py-1 text-xs font-semibold",
            TRACK_BADGE_CLASS[track.accent]
          )}
        >
          {track.shortTitle}
        </span>
        <span className="font-medium text-foreground">{track.title}</span>
        <span className="mt-auto text-xs text-muted">
          {live
            ? `${plural(track.totalLessons, "lesson")} · ${formatMinutes(track.totalMinutes)}`
            : `Syllabus published · ${plural(track.plannedTopics, "topic")}`}
        </span>
      </Link>
    </li>
  );
}

/** Shown until localStorage has been read, so no number is ever wrong on screen. */
function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading your progress">
      <div className="h-56 animate-pulse rounded-2xl border border-border bg-surface" />
      <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
    </div>
  );
}

/* ------------------------------------------------------------------- page */

export function DashboardClient({ tracks }: { tracks: DashboardTrack[] }) {
  const { completed, hydrated } = useProgress();

  const entries = useMemo(() => read(tracks, completed), [tracks, completed]);
  const stale = useMemo(() => countStale(tracks, completed), [tracks, completed]);

  const totals = useMemo(() => {
    const lessons = tracks.reduce((sum, t) => sum + t.totalLessons, 0);
    const minutes = tracks.reduce((sum, t) => sum + t.totalMinutes, 0);
    const done = entries.reduce((sum, e) => sum + e.done, 0);
    const minutesDone = entries.reduce((sum, e) => sum + e.minutesDone, 0);
    return { lessons, minutes, done, minutesDone };
  }, [tracks, entries]);

  // Most progress first; ties broken by curriculum order so the list never
  // reshuffles between two tracks that are level.
  const started = entries
    .filter((entry) => entry.done > 0)
    .sort((a, b) =>
      b.done / b.track.totalLessons - a.done / a.track.totalLessons ||
      b.done - a.done ||
      tracks.indexOf(a.track) - tracks.indexOf(b.track)
    );
  const notStarted = entries.filter((entry) => entry.done === 0);

  if (!hydrated) return <Loading />;

  return (
    <div className="space-y-10">
      <section
        aria-labelledby="overall-heading"
        className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
      >
        <h2 id="overall-heading" className="sr-only">
          Overall progress
        </h2>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Ring done={totals.done} total={totals.lessons} />
          <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              icon={Layers}
              label="Tracks started"
              value={`${started.length}`}
              detail={`of ${tracks.length} in the curriculum`}
            />
            <Stat
              icon={BookOpen}
              label="Lessons done"
              value={`${totals.done}`}
              detail={`of ${totals.lessons} written so far`}
            />
            <Stat
              icon={Clock}
              label="Time invested"
              value={formatMinutes(totals.minutesDone)}
              detail={`of ${formatMinutes(totals.minutes)} on offer`}
            />
            <Stat
              icon={Sparkles}
              label="Modules touched"
              value={`${started.reduce((sum, e) => sum + e.modulesTouched, 0)}`}
              detail="with at least one lesson done"
            />
          </div>
        </div>

        {totals.done > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              How your {plural(totals.done, "completed lesson")} split across tracks
            </p>
            <SplitBar entries={started} total={totals.done} />
          </div>
        )}
      </section>

      {started.length > 0 ? (
        <section aria-labelledby="started-heading">
          <h2 id="started-heading" className="mb-3 text-lg font-semibold text-foreground">
            In progress
            <span className="ml-2 text-sm font-normal text-muted">
              {plural(started.length, "track")}
            </span>
          </h2>
          <p className="mb-4 text-sm text-muted">
            Each square is one module, shaded by how much of it you have finished. Hover or focus
            anything on this page for the exact numbers.
          </p>
          <ul className="space-y-4">
            {started.map((entry) => (
              <StartedTrack key={entry.track.slug} entry={entry} />
            ))}
          </ul>
        </section>
      ) : (
        <section
          aria-labelledby="empty-heading"
          className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center"
        >
          <h2 id="empty-heading" className="text-lg font-semibold text-foreground">
            Nothing marked complete yet
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
            This page fills in as you work. Every lesson has a Mark Complete button at the bottom;
            press it and the track shows up here with its modules shaded in.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/roadmap"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              Start with the roadmap
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/curriculum"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
            >
              Browse the tracks
            </Link>
          </div>
        </section>
      )}

      {notStarted.length > 0 && (
        <section aria-labelledby="not-started-heading">
          <h2 id="not-started-heading" className="mb-3 text-lg font-semibold text-foreground">
            Not started
            <span className="ml-2 text-sm font-normal text-muted">
              {plural(notStarted.length, "track")}
            </span>
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notStarted.map((entry) => (
              <NotStartedTrack key={entry.track.slug} entry={entry} />
            ))}
          </ul>
        </section>
      )}

      <footer className="space-y-2 border-t border-border pt-5 text-xs text-muted">
        <p>
          Progress is stored in this browser only — it is never sent anywhere, so it does not
          follow you to another device and clearing site data resets it.
        </p>
        {stale > 0 && (
          <p>
            {plural(stale, "completed lesson")} in storage no longer{" "}
            {stale === 1 ? "matches a lesson" : "match lessons"} in the curriculum, most likely
            renamed since. {stale === 1 ? "It is" : "They are"} left alone and not counted above.
          </p>
        )}
      </footer>
    </div>
  );
}
