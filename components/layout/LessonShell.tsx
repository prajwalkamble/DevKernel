import { ChevronDown } from "lucide-react";
import { SidebarNav } from "./SidebarNav";

export function LessonShell({ children }: { children: React.ReactNode }) {
  return (
    // Column below `lg`, where the sidebar collapses into a drawer that belongs
    // above the lesson; row from `lg` up, where it is a real sidebar beside it.
    <div className="page-shell-wide flex flex-col lg:flex-row">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r border-border scrollbar-thin lg:block">
        <SidebarNav />
      </aside>

      <details className="border-b border-border lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 text-sm font-medium text-foreground marker:content-none sm:px-6">
          <ChevronDown className="h-4 w-4 text-muted" />
          Browse curriculum
        </summary>
        <div className="scrollbar-thin max-h-[60vh] overflow-y-auto border-t border-border">
          <SidebarNav />
        </div>
      </details>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
