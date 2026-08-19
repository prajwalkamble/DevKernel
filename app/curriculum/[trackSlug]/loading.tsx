import { LoadingRegion, Skeleton, SkeletonModuleCard } from "@/components/skeleton/Skeleton";

/** Mirrors app/curriculum/[trackSlug]/page.tsx: track header, stats, module map. */
export default function TrackLoading() {
  return (
    <LoadingRegion
      label="Loading this track"
      className="mx-auto max-w-4xl px-5 py-10 sm:px-6"
    >
      <Skeleton className="mb-6 h-4 w-24" />

      <div className="mb-8">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="mt-2.5 h-8 w-64 sm:h-9" />
        <Skeleton className="mt-2 h-5 w-full max-w-md" />
        <div className="mt-4 max-w-2xl space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-36" />
        </div>
        <Skeleton className="mt-6 h-10 w-40 rounded-lg" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonModuleCard key={i} />
        ))}
      </div>
    </LoadingRegion>
  );
}
