import clsx from "clsx";

/**
 * A single placeholder block. Skeletons are decoration, so every one of them is
 * hidden from assistive technology — the surrounding `LoadingRegion` announces
 * the loading state once instead, which is what a screen reader user needs.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("skeleton rounded-md", className)} />;
}

/**
 * Several lines of placeholder text. The last line is shortened because real
 * paragraphs rarely fill their final line, and matching that stops the block
 * from reading as a solid slab.
 */
export function SkeletonText({
  lines = 3,
  className,
  lineClassName,
}: {
  lines?: number;
  className?: string;
  lineClassName?: string;
}) {
  return (
    <div className={clsx("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={clsx("h-3.5", i === lines - 1 ? "w-4/6" : "w-full", lineClassName)}
        />
      ))}
    </div>
  );
}

/**
 * Wraps a screen of skeletons. `aria-busy` plus one polite announcement is the
 * whole accessible story — without it a screen reader meets a page of empty
 * divs and reports nothing at all.
 */
export function LoadingRegion({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** The card shape used for a track on the home page and the track list. */
export function SkeletonTrackCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <Skeleton className="h-5 w-16 rounded" />
      <Skeleton className="mt-2.5 h-5 w-2/5" />
      <Skeleton className="mt-2 h-3.5 w-4/5" />
      {!compact && <SkeletonText className="mt-3" lines={2} />}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-28" />
        {!compact && <Skeleton className="h-3 w-24" />}
      </div>
    </div>
  );
}

/** The module block used on a track's curriculum page. */
export function SkeletonModuleCard({ lessons = 6 }: { lessons?: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-1.5 h-5 w-1/2" />
      <SkeletonText className="mt-2" lines={2} />
      <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {Array.from({ length: lessons }, (_, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2">
            <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
