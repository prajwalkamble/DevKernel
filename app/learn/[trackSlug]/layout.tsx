import { LessonShell } from "@/components/layout/LessonShell";

/**
 * The lesson shell lives here rather than in the page, and that placement is
 * the whole point of the file.
 *
 * A page is replaced on every navigation; a layout is not. With the shell in
 * the page, clicking a lesson unmounted the sidebar and mounted a new one —
 * so its scroll position went back to the top and any module the reader had
 * expanded collapsed again. Here, the `<aside>` is the same DOM node from one
 * lesson to the next and simply keeps its scroll.
 *
 * It sits under `[trackSlug]` so that switching tracks *does* rebuild it,
 * which is right: the sidebar's contents change completely.
 */
export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <LessonShell>{children}</LessonShell>;
}
