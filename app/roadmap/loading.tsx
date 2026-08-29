import { LoadingRegion, Skeleton, SkeletonText } from "@/components/skeleton/Skeleton";

/**
 * Mirrors app/roadmap/page.tsx: the header, the three entry cards, the first
 * month as a run of week cards, then the module list.
 *
 * Counts match the real data — five weeks and seven modules — so the swap when
 * the content arrives moves the page as little as possible.
 */
export default function RoadmapLoading() {
  return (
    <LoadingRegion
      label="Loading the roadmap"
      className="mx-auto max-w-4xl px-5 py-10 sm:px-6"
    >
      <header className="mb-10">
        <Skeleton className="h-5 w-28 rounded" />
        <Skeleton className="mt-2 h-8 w-full max-w-2xl sm:h-9" />
        <div className="mt-2 max-w-2xl space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-56" />
        </div>
      </header>

      {/* "Where do you start?" — heading, then the three entry cards. */}
      <section className="mb-12">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-6 w-52" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col rounded-xl border border-border p-4">
              <Skeleton className="h-4 w-4/5" />
              <SkeletonText className="mt-2.5" lines={4} />
              <Skeleton className="mt-4 h-3.5 w-2/3" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-3 h-11 w-full max-w-lg rounded-lg" />
      </section>

      {/* "Your first month" — five week cards, each a two-column split. */}
      <section className="mb-12">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-6 w-44" />
        </div>
        <div className="mt-2 max-w-2xl space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-4 w-2/5" />
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 2 }, (_, col) => (
                  <div key={col}>
                    <Skeleton className="h-3 w-36" />
                    <SkeletonText className="mt-2" lines={3} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* "The five modules" — the module cards. */}
      <section>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="mt-2 max-w-2xl space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
        <div className="mt-4 space-y-4">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24 rounded" />
              </div>
              <Skeleton className="mt-1.5 h-5 w-1/2" />
              <SkeletonText className="mt-2" lines={2} />
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </LoadingRegion>
  );
}
