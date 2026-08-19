"use client";

import { usePathname } from "next/navigation";
import { useProgress } from "@/lib/useProgress";

/**
 * Shows progress for the track you are currently in, and overall progress
 * everywhere else. Totals are computed on the server and passed down so the
 * whole curriculum does not have to be reachable from this component.
 */
export function HeaderProgress({ totals }: { totals: Record<string, number> }) {
  const pathname = usePathname();
  const { completed, completedInTrack } = useProgress();

  const match = pathname.match(/^\/(?:learn|curriculum)\/([^/]+)/);
  const trackSlug = match?.[1] && match[1] in totals ? match[1] : null;

  const total = trackSlug
    ? totals[trackSlug]
    : Object.values(totals).reduce((sum, n) => sum + n, 0);
  const done = trackSlug ? completedInTrack(trackSlug) : completed.size;
  const pct = total > 0 ? Math.round((Math.min(done, total) / total) * 100) : 0;

  // Nothing meaningful to show for a track whose lessons are still being written.
  if (total === 0) return null;

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted">
        {done}/{total}
      </span>
    </div>
  );
}
