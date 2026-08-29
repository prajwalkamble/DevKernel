import { LoadingRegion, Skeleton, SkeletonTrackCard } from "@/components/skeleton/Skeleton";

/**
 * Mirrors app/curriculum/(index)/page.tsx: a heading, then the two grouped
 * sections.
 *
 * Grouped under `(index)` so it covers only `/curriculum`. A loading file
 * wraps every nested segment below it too, so at `app/curriculum/` this list
 * stood in for `/curriculum/[trackSlug]` as well and that route's own skeleton
 * never appeared.
 */
export default function CurriculumLoading() {
  return (
    <LoadingRegion label="Loading tracks" className="mx-auto max-w-4xl px-5 py-10 sm:px-6">
      <div className="mb-10">
        <Skeleton className="h-8 w-32" />
        <div className="mt-3 max-w-2xl space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>

      {[6, 2].map((count, section) => (
        <section key={section} className="mb-12">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="mt-2.5 max-w-2xl space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: count }, (_, i) => (
              <SkeletonTrackCard key={i} />
            ))}
          </div>
        </section>
      ))}
    </LoadingRegion>
  );
}
