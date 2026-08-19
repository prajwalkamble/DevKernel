import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleDashed,
  Compass,
  ListChecks,
  Map as MapIcon,
  Rocket,
  Terminal,
} from "lucide-react";
import clsx from "clsx";
import {
  FIRST_MONTH,
  getRoadmapModuleStats,
  modulesInPhases,
  ROADMAP_MODULES,
  type RoadmapModule,
  type RoadmapStatus,
} from "@/content/roadmap";
import { getPracticeStats } from "@/content/practice";
import { getTrackBySlug, lessonHref, trackHref } from "@/content/tracks";
import { TRACK_BADGE_CLASS } from "@/lib/trackTheme";

export const metadata: Metadata = {
  title: "The Roadmap — DevKernel",
  description:
    "Five modules from your first for-loop to system design you can defend. Where to start if you have never coded, where to start if you have, and what a month of it actually buys you.",
};

const STATUS_LABEL: Record<RoadmapStatus, string> = {
  live: "Lessons live",
  syllabus: "Syllabus published",
  planned: "Not started",
};

const STATUS_CLASS: Record<RoadmapStatus, string> = {
  live: "bg-success-soft text-success",
  syllabus: "bg-accent-soft text-accent",
  planned: "bg-surface-hover text-muted",
};

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** The first readable lesson of the framework module — the one live entry point. */
function frameworkEntry() {
  const dsa = getTrackBySlug("dsa");
  const mod = dsa?.modules.find((m) => m.slug === "the-framework");
  const lesson = mod?.lessons[0];
  return mod && lesson ? lessonHref("dsa", mod.slug, lesson.slug) : trackHref("dsa");
}

export default function RoadmapPage() {
  const practice = getPracticeStats();
  const framework = frameworkEntry();

  // Only the entries pinned to specific stages, which is the path itself.
  // Module 3 lists six whole tracks it is partly served by, and counting those
  // would report the size of the entire site as though it were this roadmap.
  const totals = ROADMAP_MODULES.filter((entry) => entry.phases).reduce(
    (acc, entry) => {
      const stats = getRoadmapModuleStats(entry);
      return {
        modules: acc.modules + stats.modules,
        live: acc.live + stats.liveLessons,
        planned: acc.planned + stats.plannedLessons,
      };
    },
    { modules: 0, live: 0, planned: 0 }
  );

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6">
      <header className="mb-10">
        <span className="inline-flex items-center gap-1.5 rounded bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
          <MapIcon className="h-3.5 w-3.5" />
          The Roadmap
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-balance text-foreground sm:text-3xl">
          From your first for-loop to a system you can defend
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-pretty text-muted sm:text-lg">
          Five modules in one order. Module 0 assumes you have never written code; everything after
          it assumes only the module before it. If you already code, the whole first module is an
          afternoon of skimming — the page below says exactly where to jump in.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
          <span>
            <strong className="font-semibold text-foreground">{totals.modules}</strong> modules
            across DSA and System Design
          </span>
          <span aria-hidden>·</span>
          <span>{totals.live} lessons live</span>
          <span aria-hidden>·</span>
          <span>{totals.planned} more with a published syllabus</span>
          <span aria-hidden>·</span>
          <span>{practice.total} problems you can solve in the browser</span>
        </div>
      </header>

      {/* The whole point of the page: two people arrive here and they need
          different first clicks. Making them choose is cheaper than writing a
          paragraph that tries to serve both. */}
      <section className="mb-12">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Compass className="h-4 w-4" />
          </span>
          Where do you start?
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <EntryCard
            title="I have never written code"
            body="Start at Module 0 and do it in order. Nothing before it is assumed, and the pattern-printing module is the drill that makes loops stop being frightening."
            action="See the Module 0 syllabus"
            href={trackHref("dsa")}
          />
          <EntryCard
            title="I can code, but I freeze on problems"
            body="Skip Module 0. Read the Framework — it is the eight lessons that turn a blank editor into a procedure, and it is the part of the path that is fully written today."
            action="Read the Framework"
            href={framework}
            emphasis
          />
          <EntryCard
            title="My DSA is fine, I need design"
            body="Go straight to Module 2. It starts at SQL rather than at architecture diagrams, because that is the part you can practise and the part the rest is built on."
            action="See the System Design syllabus"
            href={trackHref("system-design")}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
          >
            <ListChecks className="h-4 w-4" />
            Or just solve one now — {practice.total} problems, graded in the browser
          </Link>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Rocket className="h-4 w-4" />
          </span>
          Your first month
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Two columns, because the same week looks different depending on where you started. Follow
          one of them; do not try to follow both.
        </p>

        <ol className="mt-4 space-y-3">
          {FIRST_MONTH.map((week) => (
            <li
              key={week.week}
              className="rounded-xl border border-border bg-surface p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="rounded bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                  {week.week}
                </span>
                <h3 className="text-base font-semibold text-foreground">{week.title}</h3>
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <WeekColumn heading="If you are new to code" items={week.beginner} />
                <WeekColumn heading="If you already code" items={week.experienced} />
              </div>

              <p className="mt-3 flex gap-2 border-t border-border pt-3 text-sm leading-relaxed text-foreground/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={3} />
                <span>
                  <span className="font-medium text-foreground">By Sunday: </span>
                  {week.outcome}
                </span>
              </p>
            </li>
          ))}
        </ol>

        {/* Said out loud rather than left to be discovered in week five. */}
        <p className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
          <strong className="font-semibold text-foreground">What a month does not buy you.</strong>{" "}
          Not mastery, and not a finished track. Four weeks gets you to the point where you solve
          problems daily without stalling, name patterns before you type, and can hold a design
          conversation about one service. Working through Modules 0 to 2 properly is closer to five
          or six months. Anyone promising the whole thing in thirty days is selling you the schedule,
          not the skill.
        </p>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Terminal className="h-4 w-4" />
          </span>
          The five modules
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Each one is either a track you can open today, part of one, or honestly marked as not
          started. Nothing here is a placeholder pretending to be finished.
        </p>

        <div className="mt-4 space-y-4">
          {ROADMAP_MODULES.map((entry) => (
            <ModuleCard key={entry.id} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  );
}

function EntryCard({
  title,
  body,
  action,
  href,
  emphasis = false,
}: {
  title: string;
  body: string;
  action: string;
  href: string;
  emphasis?: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex flex-col rounded-xl border p-4 transition-colors",
        emphasis
          ? "border-accent/40 bg-accent-soft/40 hover:bg-accent-soft/70"
          : "border-border bg-surface hover:bg-surface-hover"
      )}
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{body}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
        {action}
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

function WeekColumn({ heading, items }: { heading: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{heading}</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground/85">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 text-accent">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModuleCard({ entry }: { entry: RoadmapModule }) {
  const stats = getRoadmapModuleStats(entry);
  const tracksBehind = entry.trackSlugs
    .map((slug) => getTrackBySlug(slug))
    .filter((track) => track !== undefined);

  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-surface-hover px-2 py-0.5 text-xs font-semibold text-foreground">
          {entry.label}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[entry.status]}`}
        >
          {STATUS_LABEL[entry.status]}
        </span>
      </div>

      <h3 className="mt-2 text-xl font-semibold text-foreground">{entry.title}</h3>
      <p className="mt-0.5 text-sm text-muted">{entry.tagline}</p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pretty text-foreground/80">
        {entry.summary}
      </p>

      {stats.modules > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>{plural(stats.modules, "module")}</span>
          {stats.liveLessons > 0 && <span>{stats.liveLessons} lessons live</span>}
          {stats.plannedLessons > 0 && <span>{stats.plannedLessons} lessons planned</span>}
        </div>
      )}

      {/* Which stages of which track carry this module, so the mapping from the
          roadmap onto the curriculum is never something you have to infer. */}
      {entry.phases && entry.trackSlugs.length > 0 && (
        <ul className="mt-3 space-y-1">
          {entry.trackSlugs.flatMap((slug) =>
            (entry.phases ?? [])
              .map((phase) => ({ phase, count: modulesInPhases(slug, [phase]).length }))
              .filter(({ count }) => count > 0)
              .map(({ phase, count }) => (
                <li
                  key={`${slug}-${phase}`}
                  className="flex items-center gap-2 text-sm text-foreground/75"
                >
                  <CircleDashed className="h-3.5 w-3.5 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1">{phase}</span>
                  <span className="shrink-0 text-xs text-muted">{plural(count, "module")}</span>
                </li>
              ))
          )}
        </ul>
      )}

      {entry.topics && (
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-foreground/75">
          {entry.topics.map((topic, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0 text-muted">·</span>
              <span>{topic}</span>
            </li>
          ))}
        </ul>
      )}

      {entry.gaps && (
        <div className="mt-3 rounded-lg border border-dashed border-border px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Not covered yet
          </p>
          <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-muted">
            {entry.gaps.map((gap, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0">·</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tracksBehind.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tracksBehind.map((track) => (
            <Link
              key={track.slug}
              href={trackHref(track.slug)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover"
            >
              <span className={`rounded px-1.5 py-0.5 ${TRACK_BADGE_CLASS[track.accent]}`}>
                {track.shortTitle}
              </span>
              <ArrowRight className="h-3 w-3 text-muted" />
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
