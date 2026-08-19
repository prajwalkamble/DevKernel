import { LoadingRegion, Skeleton } from "@/components/skeleton/Skeleton";

/** Mirrors the playground chrome: toolbar, then the editor/output split. */
export default function PlaygroundLoading() {
  return (
    <LoadingRegion label="Loading playground" className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-border px-3 py-1.5 md:hidden">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
        <div className="min-h-0 space-y-2.5 p-4 md:border-r md:border-border">
          {["w-2/5", "w-4/5", "w-3/5", "w-1/3", "w-5/6", "w-1/2", "w-2/3"].map((width, i) => (
            <Skeleton key={i} className={`h-3.5 ${width}`} />
          ))}
        </div>
        <div className="hidden min-h-0 space-y-2.5 bg-console p-4 md:block">
          <Skeleton className="h-3.5 w-3/5" />
          <Skeleton className="h-3.5 w-2/5" />
        </div>
      </div>
    </LoadingRegion>
  );
}
