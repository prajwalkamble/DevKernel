import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft, ListChecks } from "lucide-react";
import { CurriculumMap } from "@/components/curriculum/CurriculumMap";
import { getPracticeStats } from "@/content/practice";
import {
  getFirstLesson,
  getPlannedLessonCount,
  getTrackBySlug,
  getTrackStats,
  lessonBudgetLabel,
  lessonHref,
  tracks,
} from "@/content/tracks";
import { TRACK_BADGE_CLASS } from "@/lib/trackTheme";

interface TrackPageProps {
  params: Promise<{ trackSlug: string }>;
}

/**
 * Every track is known at build time, so anything else is a 404 — and saying so
 * here matters more than it looks. `loading.tsx` makes this route stream, and a
 * streamed response has already committed a 200 by the time `notFound()` runs.
 * Refusing unknown params at the routing layer keeps the status code honest.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return tracks.map((track) => ({ trackSlug: track.slug }));
}

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const { trackSlug } = await params;
  const track = getTrackBySlug(trackSlug);
  if (!track) return {};
  return {
    title: `${track.title} — DevKernel`,
    description: track.description,
  };
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { trackSlug } = await params;
  const track = getTrackBySlug(trackSlug);

  if (!track) {
    notFound();
  }

  const stats = getTrackStats(track);
  const practiceStats = getPracticeStats();
  const first = getFirstLesson(track);
  const hours = Math.round(stats.estimatedMinutes / 60);
  const planned = getPlannedLessonCount(track);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6">
      <Link
        href="/curriculum"
        className="mb-6 -ml-1.5 inline-flex min-h-9 items-center gap-1 rounded-md px-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All tracks
      </Link>

      <div className="mb-8">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${TRACK_BADGE_CLASS[track.accent]}`}
        >
          Track {track.order}
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {track.title}
        </h1>
        <p className="mt-1 text-base text-muted sm:text-lg">{track.tagline}</p>
        <p className="mt-4 max-w-2xl leading-relaxed text-pretty text-foreground/80">
          {track.description}
        </p>

        {track.mode === "revise" && (
          <p className="mt-3 max-w-2xl rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
            Every topic below becomes one short lesson, sized to be read in {track.lessonMinutes[0]}{"\u2013"}
            {track.lessonMinutes[1]} minutes and to make sense on its own — so this works as a
            straight re-read or as somewhere to look one thing up.
          </p>
        )}

        {!track.interviewPrep && (
          <p className="mt-3 max-w-2xl rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
            This track is aimed at building and understanding real programs, not at passing an
            interview. The room that would go to interview questions goes to code you compile and
            run, tooling, and projects instead.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          <span>{track.modules.length} modules</span>
          <span>
            {stats.availableLessons > 0
              ? `${stats.availableLessons} lessons live now`
              : `${planned} lessons planned`}
          </span>
          <span>{lessonBudgetLabel(track)}</span>
          {hours > 0 && <span>≈ {hours} hours of reading</span>}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {stats.availableLessons > 0 && (
            <Link
              href={lessonHref(track.slug, first.moduleSlug, first.slug)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Start this track
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {/* The problem sheet belongs to DSA alone for now. When a second
              track grows one, this becomes a field on the track rather than
              a slug check. */}
          {track.slug === "dsa" && (
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
            >
              <ListChecks className="h-4 w-4" />
              {practiceStats.total} problems on the sheet
            </Link>
          )}
        </div>
      </div>

      <CurriculumMap track={track} />
    </div>
  );
}
