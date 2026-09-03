import Link from "next/link";
import { DevKernelMark } from "@/components/brand/DevKernelMark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { HeaderNav } from "./HeaderNav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="page-shell relative flex h-14 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
        {/* Below sm the logo is centred on the header and lifted out of the
            flex flow, so the only items left to space apart are the menu
            button and the controls — which puts them at the two ends. From sm
            up it drops back into the flow as the first item. */}
        <Link
          href="/"
          className="absolute left-1/2 flex -translate-x-1/2 shrink-0 items-center gap-2 font-semibold text-foreground sm:static sm:translate-x-0"
        >
          <DevKernelMark className="h-5 w-auto shrink-0" />
          <span>DevKernel</span>
        </Link>

        <HeaderNav />

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
