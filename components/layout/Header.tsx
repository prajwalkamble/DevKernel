import Link from "next/link";
import { Hexagon } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getTrackStats, tracks } from "@/content/tracks";
import { HeaderProgress } from "./HeaderProgress";

export function Header() {
  const totals = Object.fromEntries(
    tracks.map((track) => [track.slug, getTrackStats(track).availableLessons])
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold text-foreground"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Hexagon className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">DevKernel</span>
        </Link>

        <nav className="flex min-w-0 items-center gap-0.5 text-sm sm:gap-1">
          <Link
            href="/roadmap"
            className="rounded-md px-2 py-1.5 font-medium text-foreground/80 transition-colors hover:bg-surface-hover hover:text-foreground sm:px-3"
          >
            Roadmap
          </Link>
          <Link
            href="/curriculum"
            className="rounded-md px-2 py-1.5 font-medium text-foreground/80 transition-colors hover:bg-surface-hover hover:text-foreground sm:px-3"
          >
            Tracks
          </Link>
          <Link
            href="/practice"
            className="rounded-md px-2 py-1.5 font-medium text-foreground/80 transition-colors hover:bg-surface-hover hover:text-foreground sm:px-3"
          >
            Problems
          </Link>
          <Link
            href="/visualize"
            className="rounded-md px-2 py-1.5 font-medium text-foreground/80 transition-colors hover:bg-surface-hover hover:text-foreground sm:px-3"
          >
            Visualise
          </Link>
          <Link
            href="/playground"
            className="rounded-md px-2 py-1.5 font-medium text-foreground/80 transition-colors hover:bg-surface-hover hover:text-foreground sm:px-3"
          >
            Playground
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <HeaderProgress totals={totals} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
