import { LoadingRegion, Skeleton, SkeletonText } from "@/components/skeleton/Skeleton";

/** Mirrors app/practice/page.tsx: the header, four filter rows, then the list. */
export default function PracticeLoading() {
  return (
    <LoadingRegion label="Loading problems" className="mx-auto max-w-4xl px-5 py-10 sm:px-6">
      <div className="mb-8">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="mt-2.5 h-8 w-40" />
        <Skeleton className="mt-2 h-5 w-3/5" />
        <SkeletonText className="mt-4 max-w-2xl" lines={4} />
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          {["w-20", "w-44", "w-24", "w-28"].map((width) => (
            <Skeleton key={width} className={`h-3.5 ${width}`} />
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="mb-5 space-y-3">
        {[3, 8, 8, 8].map((chips, row) => (
          <div key={row} className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-3 w-16 shrink-0" />
            {Array.from({ length: chips }, (_, i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-full" />
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface px-4 py-3">
            <div className="flex items-start gap-3">
              <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="mt-2 h-3.5 w-4/5" />
                <div className="mt-2 flex gap-1.5">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
