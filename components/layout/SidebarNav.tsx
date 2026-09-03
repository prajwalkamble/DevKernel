"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { defaultTrack, getFirstLesson, getTrackBySlug, lessonHref, tracks } from "@/content/tracks/meta";
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

  /* This component no longer remounts between lessons — the shell is a layout
     — which is what preserves the reader's scroll and their expanded modules.
     The one thing that used to come free with remounting was the current
     module being open, so it is done explicitly: when the route moves into a
     different module, that module is added to the open set without closing
     anything the reader opened themselves.

     Adjusted during render rather than in an effect, which is the documented
     way to react to a changed input: it runs before the children below and
     costs no second commit. */
  const [seenModule, setSeenModule] = useState(currentModuleSlug);
  if (currentModuleSlug !== seenModule) {
    setSeenModule(currentModuleSlug);
    if (currentModuleSlug) {
      setOpenModules((prev) => (prev.has(currentModuleSlug) ? prev : new Set(prev).add(currentModuleSlug)));
    }
  }

  /* On first mount only, bring the current lesson into view. Arriving at the
     capstone module otherwise opens the sidebar at the top with the active
     lesson below the fold. Mount-only is deliberate: running it on every
     navigation would fight the scroll position this component exists to keep.

     Deliberately not `scrollIntoView`. That method scrolls *every* scrollable
     ancestor, the document included, so it nudged the whole page down by a
     pixel on load — measurably, which is how this was found. Setting the
     scroll container's own `scrollTop` touches exactly one element and cannot
     move the window. */
  const activeLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const link = activeLink.current;
    /* Null while the mobile drawer is closed — its contents are not laid out,
       so there is nothing to scroll to and every measurement would be zero. */
    if (!link?.offsetParent) return;

    let box = link.parentElement;
    while (box && box !== document.body && box.scrollHeight <= box.clientHeight) {
      box = box.parentElement;
    }
    if (!box || box === document.body) return;

    const item = link.getBoundingClientRect();
    const frame = box.getBoundingClientRect();
    if (item.top < frame.top) box.scrollTop -= frame.top - item.top;
    else if (item.bottom > frame.bottom) box.scrollTop += item.bottom - frame.bottom;
  }, []);

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
                          ref={active ? activeLink : undefined}
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
