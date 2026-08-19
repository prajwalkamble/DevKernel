import { LoadingRegion, Skeleton, SkeletonText } from "@/components/skeleton/Skeleton";

/**
 * Mirrors the lesson route: the sidebar shell from `lg` up, then the article —
 * title, summary, objectives box, and a run of prose-and-code sections.
 *
 * The proportions are deliberately close to a real lesson so the swap when the
 * content arrives shifts as little as possible.
 */
export default function LessonLoading() {
  return (
    <LoadingRegion label="Loading lesson" className="mx-auto flex max-w-7xl flex-col lg:flex-row">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 border-r border-border p-3 lg:block">
        <Skeleton className="mb-2 h-3 w-12" />
        <div className="mb-4 flex flex-wrap gap-1.5">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-14 rounded-md" />
          ))}
        </div>
        <div className="space-y-2 border-t border-border pt-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5">
              <Skeleton className="h-3.5 w-3.5 shrink-0" />
              <Skeleton className="h-3.5 flex-1" />
            </div>
          ))}
        </div>
      </aside>

      <div className="border-b border-border px-5 py-3 lg:hidden">
        <Skeleton className="h-4 w-40" />
      </div>

      <article className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        <Skeleton className="h-8 w-4/5 sm:h-9" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <Skeleton className="mt-4 h-4 w-28" />

        <div className="mt-5 rounded-lg border border-border bg-surface p-4">
          <Skeleton className="h-4 w-56" />
          <div className="mt-3 space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-3.5 w-full" />
            ))}
          </div>
        </div>

        {Array.from({ length: 3 }, (_, section) => (
          <section key={section} className="mt-10 space-y-4">
            <Skeleton className="h-6 w-2/5" />
            <SkeletonText lines={4} />
            <SkeletonText lines={3} />
            {/* A code block: header strip, then lines of monospace. */}
            <div className="overflow-hidden rounded-lg border border-border bg-code">
              <div className="flex items-center justify-between border-b border-border/60 bg-code-header px-3 py-1.5">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              {/* Ragged widths, because code lines are never all the same length. */}
              <div className="space-y-2 p-4">
                {["w-5/6", "w-1/2", "w-3/4", "w-2/5", "w-4/6"].map((width, i) => (
                  <Skeleton key={i} className={`h-3 ${width}`} />
                ))}
              </div>
            </div>
            <SkeletonText lines={2} />
          </section>
        ))}
      </article>
    </LoadingRegion>
  );
}
