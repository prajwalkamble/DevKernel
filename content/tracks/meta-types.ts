/**
 * The curriculum with the lesson bodies removed.
 *
 * Almost nothing on the site needs a lesson's sections. The header wants a
 * count, the sidebar wants titles, the curriculum map wants durations and
 * statuses — and every one of those pages was importing the whole tree to get
 * them, because `content/tracks/index.ts` reaches every lesson file and a
 * lesson file carries its examples in seven languages.
 *
 * Two costs came out of that, and the second is the one that mattered. Every
 * route compiled all 621 content files, because the header sits in the root
 * layout; and `SidebarNav` and `CurriculumMap` are Client Components, so the
 * entire curriculum — every code example, every expected output — was bundled
 * and shipped to the browser on the first page load.
 *
 * These types are the shape that survives once the bodies are gone. The values
 * live in `manifest.generated.ts`, which is derived from the real tree by
 * `scripts/generate-track-manifest.ts` rather than maintained by hand, so the
 * two cannot disagree about what exists.
 */
import type { ModuleStatus, TrackAccent, TrackMode } from "@/content/types";

export interface LessonMeta {
  slug: string;
  moduleSlug: string;
  title: string;
  estimatedMinutes: number;
  status: ModuleStatus;
  /**
   * How many topics a preview lesson publishes.
   *
   * A module nobody has written yet contributes one preview lesson whose
   * `takeaways` are the topics it will cover, and the planned-lesson count is
   * a sum of those. Only the number is needed, never the strings.
   */
  takeawayCount: number;
}

/*
 * `summary` is deliberately absent. Only the lesson page renders one, and that
 * page has the whole lesson in hand — so carrying 653 summaries here would put
 * a paragraph of prose per lesson into the client bundle that nothing reads.
 */

export interface ModuleMeta {
  slug: string;
  trackSlug: string;
  title: string;
  description: string;
  order: number;
  status: ModuleStatus;
  phase?: string;
  lessons: LessonMeta[];
}

export interface TrackMeta {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  order: number;
  status: ModuleStatus;
  accent: TrackAccent;
  mode: TrackMode;
  lessonMinutes: [number, number];
  interviewPrep: boolean;
  runnable: boolean;
  modules: ModuleMeta[];
}
