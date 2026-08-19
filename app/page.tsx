import Link from "next/link";
import { ArrowRight, Construction, Layers, Play, Sparkles, Target } from "lucide-react";
import {
  getPlannedLessonCount,
  getTotalLessonCount,
  getTrackStats,
  getTracksByMode,
  tracks,
  trackHref,
} from "@/content/tracks";
import { TRACK_BADGE_CLASS } from "@/lib/trackTheme";

export default function Home() {
  const totalLessons = getTotalLessonCount();

  return (
    <div>
      <section className="mx-auto max-w-5xl px-5 pt-12 pb-10 text-center sm:px-6 sm:pt-16 sm:pb-12">
        <div className="mx-auto mb-5 flex w-fit max-w-full items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
          {tracks.length} tracks — {getTracksByMode("learn").length} to learn,{" "}
          {getTracksByMode("revise").length} to revise
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl md:text-5xl">
          Master the <span className="text-accent">Core</span> of Software Engineering
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-pretty text-muted sm:text-lg">
          From-scratch curricula in JavaScript &amp; TypeScript, React, Next.js, Angular, C++, Rust
          and x86-64 Assembly, plus short-form revision for Java. Every concept explained properly,
          with real examples and the pitfalls nobody warns you about.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted">
          No schedules, no cohorts, no week-one/week-two. Open it on a laptop or a phone, read one
          lesson or six, and pick up wherever you stopped.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/curriculum"
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            <Layers className="h-4 w-4" />
            Pick up Your Learning Track
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-14 sm:grid-cols-2 sm:px-6 sm:pb-16 lg:grid-cols-3">
        <FeatureCard
          icon={<Layers className="h-5 w-5" />}
          title="Learn it, or get it back"
          body="Meeting a language for the first time and returning to one you already know are different jobs. Learn tracks build up in order; revision tracks are short standalone topics you finish in a break."
        />
        <FeatureCard
          icon={<Target className="h-5 w-5" />}
          title="Depth, not just syntax"
          body="Pitfalls, edge cases and worked examples throughout. Rust and Assembly aim at building real things; the tracks people get interviewed on carry the interview questions too."
        />
        <FeatureCard
          icon={<Play className="h-5 w-5" />}
          title="A playground for all six"
          body="JavaScript, TypeScript, Rust, C++, Java and x86-64 Assembly all run in your browser — nothing to install and no server round-trip. Send any lesson's code straight to the editor and run it."
        />
      </section>

      <section className="border-t border-border bg-surface/50 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Pick a track</h2>
              <p className="mt-1 text-pretty text-muted">
                {totalLessons} lessons live now, and every track&apos;s full syllabus is published —
                so you can see exactly where each one goes before you start.
              </p>
            </div>
            <Link
              href="/curriculum"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-surface-hover"
            >
              Compare tracks
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => {
              const stats = getTrackStats(track);
              const live = stats.availableLessons > 0;

              return (
                <Link
                  key={track.slug}
                  href={trackHref(track.slug)}
                  className="flex flex-col rounded-xl border border-border bg-background p-5 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${TRACK_BADGE_CLASS[track.accent]}`}
                    >
                      {track.shortTitle}
                    </span>
                    {!live && (
                      <span className="ml-auto flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                        <Construction className="h-3 w-3" />
                        Soon
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2.5 font-semibold text-foreground">{track.title}</h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{track.tagline}</p>
                  <p className="mt-4 text-xs text-muted">
                    {track.modules.length} modules ·{" "}
                    {live
                      ? `${stats.availableLessons} lessons ready`
                      : `${getPlannedLessonCount(track)} planned`}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
