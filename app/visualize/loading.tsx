import { LoadingRegion, Skeleton } from "@/components/skeleton/Skeleton";

/**
 * Mirrors app/visualize/page.tsx: the header, then the two-column gallery —
 * the category rail and the player.
 *
 * The rail's three groups hold 9, 7 and 7 entries, so the column reaches its
 * real height and the player does not jump when the gallery mounts.
 */
const GROUPS = [9, 7, 7];

export default function VisualizeLoading() {
  return (
    <LoadingRegion
      label="Loading visualizations"
      className="mx-auto max-w-5xl px-4 py-8 sm:px-6"
    >
      <header className="mb-6">
        <Skeleton className="h-8 w-40 sm:h-9" />
        <div className="mt-2 max-w-2xl space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[13rem_1fr]">
        <div className="space-y-4">
          {GROUPS.map((count, group) => (
            <div key={group}>
              <Skeleton className="mb-1.5 h-3 w-28" />
              <div className="space-y-0.5">
                {Array.from({ length: count }, (_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="min-w-0">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
          {/* The player: canvas, then the transport row and the step caption. */}
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
            <Skeleton className="h-72 w-full rounded-none" />
            <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="ml-2 h-2 flex-1 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
          <Skeleton className="mt-3 h-4 w-3/5" />
        </div>
      </div>
    </LoadingRegion>
  );
}
