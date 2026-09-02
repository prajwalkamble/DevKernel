"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Check, Clock, Construction } from "lucide-react";
import clsx from "clsx";
import type { TrackMeta } from "@/content/tracks/meta";
import { lessonHref } from "@/content/tracks/href";
import { useProgress } from "@/lib/useProgress";

export function CurriculumMap({ track }: { track: TrackMeta }) {
  const { isComplete } = useProgress();

  return (
    <div className="space-y-6">
      {track.modules.map((mod, index) => {
        const lessonCount = mod.lessons.filter((l) => l.status === "available").length;
        const completedCount = mod.lessons.filter(
          (l) => l.status === "available" && isComplete(track.slug, mod.slug, l.slug)
        ).length;
        // A phase divider is drawn whenever the phase changes, which includes
        // the first module. Tracks that declare no phases never draw one.
        const startsPhase = Boolean(mod.phase) && mod.phase !== track.modules[index - 1]?.phase;

        return (
          <Fragment key={mod.slug}>
            {startsPhase && (
              <div className={clsx("flex items-center gap-3", index > 0 && "pt-4")}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">
                  {mod.phase}
                </h2>
                <span className="h-px flex-1 bg-border" />
              </div>
            )}
            <div
            className={clsx(
              "rounded-xl border p-5",
              mod.status === "coming-soon"
                ? "border-border/60 bg-surface/50"
                : "border-border bg-surface"
            )}
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  {/* Numbered, not called "Module N": the DSA and System Design
                      tracks group their modules into the roadmap's own Modules
                      0 to 4, and two different things called "Module 1" on one
                      page is exactly the confusion this curriculum exists to
                      avoid. The phase heading above owns that word now. */}
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {String(mod.order).padStart(2, "0")}
                  </span>
                  {mod.status === "coming-soon" && (
                    <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                      <Construction className="h-3 w-3" />
                      Coming soon
                    </span>
                  )}
                </div>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{mod.title}</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted">{mod.description}</p>
              </div>
              {mod.status === "available" && (
                <div className="flex items-center gap-2 whitespace-nowrap text-xs text-muted">
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{
                        width: `${lessonCount > 0 ? (completedCount / lessonCount) * 100 : 0}%`,
                      }}
                    />
                  </span>
                  {completedCount}/{lessonCount} complete
                </div>
              )}
            </div>

            <ul className="grid gap-1.5 sm:grid-cols-2">
              {mod.lessons.map((lesson) => {
                const done =
                  lesson.status === "available" && isComplete(track.slug, mod.slug, lesson.slug);
                return (
                  // `min-w-0` so the grid column may shrink below the row's
                  // intrinsic width; without it the truncating title never gets
                  // the chance to truncate and the page scrolls sideways.
                  <li key={lesson.slug} className="min-w-0">
                    <Link
                      href={lessonHref(track.slug, mod.slug, lesson.slug)}
                      className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm transition-colors hover:border-border hover:bg-surface-hover"
                    >
                      <span
                        className={clsx(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          done ? "border-success bg-success text-background" : "border-muted/50"
                        )}
                      >
                        {done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 truncate text-foreground/90">{lesson.title}</span>
                      {lesson.estimatedMinutes > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Clock className="h-3 w-3" />
                          {lesson.estimatedMinutes}m
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
