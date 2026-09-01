import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Construction, Map, RefreshCw } from "lucide-react";
import type { TrackMeta } from "@/content/tracks/meta";
import {
  getPlannedLessonCount,
  getTrackStats,
  getTracksByMode,
  lessonBudgetLabel,
  trackHref,
} from "@/content/tracks/meta";
import { TRACK_BADGE_CLASS } from "@/lib/trackTheme";

export const metadata: Metadata = {
  title: "Tracks — DevKernel",
  description:
    "Learn a language from scratch, or revise one you already know in short topics. JavaScript & TypeScript, Rust, x86-64 Assembly, C++ and Java.",
};

export default function CurriculumPage() {
  const learn = getTracksByMode("learn");
  const revise = getTracksByMode("revise");

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Tracks</h1>
        <p className="mt-2 max-w-2xl text-pretty text-muted">
          Every track starts at the very beginning. What changes is the pace: the ones you are
          meeting for the first time take the time they need, and the ones you are coming back to
          are cut into short topics you can finish in a break. Nothing is on a schedule — read one
          lesson or ten, on whatever you have to hand.
        </p>
        {/* Eleven cards is a lot to land on cold. Anyone who does not already
            know which track they want should be reading the roadmap instead. */}
        <Link
          href="/roadmap"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent-soft/40 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent-soft/70"
        >
          <Map className="h-4 w-4" />
          Not sure where to start? Follow the roadmap instead
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <TrackSection
        icon={<BookOpen className="h-4 w-4" />}
        title="Learn from scratch"
        blurb="New ground, starting from what the language is and what it is for. Concepts are built up in order, with worked examples and the pitfalls nobody warns you about."
        tracks={learn}
      />

      <TrackSection
        icon={<RefreshCw className="h-4 w-4" />}
        title="Revise and master"
        blurb="Languages you have written before. Same coverage, starting from the beginning, but every topic stands on its own and fits in 10 to 15 minutes — so you can read it end to end or dip in before an interview."
        tracks={revise}
      />
    </div>
  );
}

function TrackSection({
  icon,
  title,
  blurb,
  tracks,
}: {
  icon: React.ReactNode;
  title: string;
  blurb: string;
  tracks: TrackMeta[];
}) {
  return (
    <section className="mb-12">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent">
            {icon}
          </span>
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{blurb}</p>
      </div>

      <div className="space-y-4">
        {tracks.map((track) => (
          <TrackCard key={track.slug} track={track} />
        ))}
      </div>
    </section>
  );
}

function TrackCard({ track }: { track: TrackMeta }) {
  const stats = getTrackStats(track);
  const live = stats.availableLessons > 0;
  const planned = getPlannedLessonCount(track);

  return (
    <Link
      href={trackHref(track.slug)}
      className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-surface-hover"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${TRACK_BADGE_CLASS[track.accent]}`}
            >
              {track.shortTitle}
            </span>
            {!live && (
              <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                <Construction className="h-3 w-3" />
                Syllabus published
              </span>
            )}
          </div>
          <h3 className="mt-2 text-xl font-semibold text-foreground">{track.title}</h3>
          <p className="mt-1 text-sm text-muted">{track.tagline}</p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pretty text-foreground/75">
            {track.description}
          </p>
        </div>
        <ArrowRight className="mt-1 hidden h-4 w-4 shrink-0 text-muted sm:block" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
        <span>{track.modules.length} modules</span>
        <span>
          {live
            ? `${stats.availableLessons} lessons live across ${stats.availableModules} modules`
            : `${planned} lessons planned`}
        </span>
        <span>{lessonBudgetLabel(track)}</span>
        {track.runnable && <span>Runs in the playground</span>}
        {!track.interviewPrep && <span>Build-focused, not interview prep</span>}
      </div>
    </Link>
  );
}
