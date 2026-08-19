import { LoadingRegion, Skeleton, SkeletonText } from "@/components/skeleton/Skeleton";

/**
 * Mirrors the problem workspace: a top bar, then two panes — the tabbed
 * statement on the left and the editor over its results on the right.
 *
 * Shaped like the real thing rather than like a generic page, because the whole
 * point of a skeleton is that nothing jumps when the content lands.
 */
export default function ProblemLoading() {
  return (
    <LoadingRegion label="Loading problem" className="flex flex-col lg:h-[calc(100dvh-3.5rem)]">
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-3 py-2.5 sm:px-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-14 rounded" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 flex-col border-b border-border lg:w-[46%] lg:border-b-0">
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-3 py-2">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
          <div className="min-h-0 flex-1 space-y-5 px-4 py-5 sm:px-5">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
            <SkeletonText lines={3} />
            <div className="rounded-lg border border-border bg-surface p-4">
              <Skeleton className="h-4 w-24" />
              <SkeletonText className="mt-3" lines={2} />
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <Skeleton className="h-4 w-24" />
              <SkeletonText className="mt-3" lines={3} />
            </div>
          </div>
        </div>

        <div className="w-1.5 shrink-0 bg-border max-lg:hidden" />

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
          <Skeleton className="h-4 w-2/3 shrink-0 rounded-none" />
          <div className="h-[22rem] shrink-0 space-y-2.5 border-t border-border p-4 lg:h-[58%]">
            {["w-2/5", "w-4/5", "w-3/5", "w-1/3", "w-5/6", "w-1/2"].map((width, i) => (
              <Skeleton key={i} className={`h-3.5 rounded-md ${width}`} />
            ))}
          </div>
          <div className="min-h-0 flex-1 space-y-2 border-t border-border p-4">
            <SkeletonText lines={2} />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
