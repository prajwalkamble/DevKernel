import { LoadingRegion, Skeleton, SkeletonTrackCard } from "@/components/skeleton/Skeleton";

/** Mirrors app/page.tsx: hero, three feature cards, then the track grid. */
export default function HomeLoading() {
  return (
    <LoadingRegion label="Loading DevKernel">
      <section className="mx-auto max-w-5xl px-5 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-12">
        <Skeleton className="mx-auto mb-5 h-7 w-64 rounded-full" />
        <Skeleton className="mx-auto h-10 w-full max-w-3xl sm:h-12" />
        <Skeleton className="mx-auto mt-3 h-10 w-3/4 max-w-2xl sm:h-12" />
        <div className="mx-auto mt-6 max-w-2xl space-y-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mx-auto h-4 w-2/3" />
        </div>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Skeleton className="h-12 w-full rounded-lg sm:w-56" />
          <Skeleton className="h-12 w-full rounded-lg sm:w-48" />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-14 sm:grid-cols-2 sm:px-6 sm:pb-16 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5">
            <Skeleton className="mb-3 h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-2/3" />
            <div className="mt-2.5 space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
          </div>
        ))}
      </section>

      <section className="border-t border-border bg-surface/50 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="mt-2 h-4 w-full max-w-xl" />
            </div>
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonTrackCard key={i} compact />
            ))}
          </div>
        </div>
      </section>
    </LoadingRegion>
  );
}
