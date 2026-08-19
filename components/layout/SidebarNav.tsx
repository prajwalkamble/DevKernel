"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { defaultTrack, getFirstLesson, getTrackBySlug, lessonHref, tracks } from "@/content/tracks";
import { TRACK_BADGE_CLASS } from "@/lib/trackTheme";
import { useProgress } from "@/lib/useProgress";

export function SidebarNav() {
  const pathname = usePathname();
  const { isComplete } = useProgress();

  const match = pathname.match(/^\/learn\/([^/]+)\/([^/]+)\/([^/]+)/);
  const currentTrackSlug = match?.[1];
  const currentModuleSlug = match?.[2];
  const currentLessonSlug = match?.[3];

  const track = (currentTrackSlug && getTrackBySlug(currentTrackSlug)) || defaultTrack;

  const [openModules, setOpenModules] = useState<Set<string>>(
    () => new Set([currentModuleSlug ?? track.modules[0].slug])
  );

  function toggleModule(slug: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  return (
    <div>
      <div className="border-b border-border p-3">
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Track
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tracks.map((candidate) => {
            const active = candidate.slug === track.slug;
            const first = getFirstLesson(candidate);
            return (
              <Link
                key={candidate.slug}
                href={lessonHref(candidate.slug, first.moduleSlug, first.slug)}
                className={clsx(
                  "rounded-md px-2 py-1 text-xs font-semibold transition-colors",
                  active
                    ? TRACK_BADGE_CLASS[candidate.accent]
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                )}
              >
                {candidate.shortTitle}
              </Link>
            );
          })}
        </div>
      </div>

      <nav className="space-y-1 p-3 text-sm">
        {track.modules.map((mod) => {
          const isOpen = openModules.has(mod.slug);
          const lessonCount = mod.lessons.filter((l) => l.status === "available").length;
          const completedCount = mod.lessons.filter(
            (l) => l.status === "available" && isComplete(track.slug, mod.slug, l.slug)
          ).length;

          return (
            <div key={mod.slug}>
              <button
                type="button"
                onClick={() => toggleModule(mod.slug)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium text-foreground transition-colors hover:bg-surface-hover cursor-pointer"
              >
                <ChevronDown
                  className={clsx(
                    "h-3.5 w-3.5 shrink-0 text-muted transition-transform",
                    !isOpen && "-rotate-90"
                  )}
                />
                <span className="flex-1 truncate">
                  {mod.order}. {mod.title}
                </span>
                {mod.status === "coming-soon" ? (
                  <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-muted">
                    Soon
                  </span>
                ) : (
                  <span className="text-[10px] text-muted">
                    {completedCount}/{lessonCount}
                  </span>
                )}
              </button>
              {isOpen && (
                <ul className="ml-3 space-y-0.5 border-l border-border py-1 pl-3">
                  {mod.lessons.map((lesson) => {
                    const active =
                      currentModuleSlug === mod.slug && currentLessonSlug === lesson.slug;
                    const done =
                      lesson.status === "available" &&
                      isComplete(track.slug, mod.slug, lesson.slug);

                    return (
                      <li key={lesson.slug}>
                        <Link
                          href={lessonHref(track.slug, mod.slug, lesson.slug)}
                          className={clsx(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
                            active
                              ? "bg-accent-soft font-medium text-accent"
                              : "text-foreground/80 hover:bg-surface-hover hover:text-foreground"
                          )}
                        >
                          <span
                            className={clsx(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                              done
                                ? "border-success bg-success text-background"
                                : "border-muted/50"
                            )}
                          >
                            {done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                          </span>
                          <span className="truncate">{lesson.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
