"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress } from "@/lib/useProgress";

/**
 * Shows progress for the track you are currently in, and overall progress
 * everywhere else. Totals are computed on the server and passed down so the
 * whole curriculum does not have to be reachable from this component.
 *
 * It is also the way to the dashboard. A reader who wants the detail behind
 * this bar clicks the bar, which is where they were already looking — and it
 * costs no room in the header, which has none to spare.
 */
export function HeaderProgress({ totals }: { totals: Record<string, number> }) {
  const pathname = usePathname();
  const { completed, completedInTrack } = useProgress();

  const match = pathname.match(/^\/(?:learn|curriculum)\/([^/]+)/);
  const candidate = match?.[1] && match[1] in totals ? match[1] : null;
  // A track whose lessons are still being written has nothing to show, and
  // showing nothing would also take away the only way to the dashboard on that
  // page. Fall back to the overall figure instead.
  const trackSlug = candidate && totals[candidate] > 0 ? candidate : null;

  const total = trackSlug
    ? totals[trackSlug]
    : Object.values(totals).reduce((sum, n) => sum + n, 0);
  const done = trackSlug ? completedInTrack(trackSlug) : completed.size;
  const pct = total > 0 ? Math.round((Math.min(done, total) / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <Link
      href="/dashboard"
      // The bar is decoration; the label carries the meaning, and neither says
      // where the link goes, so the whole thing gets one name.
      aria-label={`Your dashboard — ${done} of ${total} lessons complete`}
      className="hidden items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-hover sm:flex"
    >
      <span className="block h-1.5 w-24 overflow-hidden rounded-full bg-surface-hover">
        <span
          className="block h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span aria-hidden className="text-xs text-muted">
        {done}/{total}
      </span>
    </Link>
  );
}
