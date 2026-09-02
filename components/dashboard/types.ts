import type { TrackAccent, TrackMode } from "@/content/types";

/**
 * The shape the dashboard page hands to the browser.
 *
 * Deliberately not `TrackMeta`. The dashboard is a Client Component — progress
 * lives in localStorage, which only the browser can read — so everything it
 * touches is serialised into the payload for this route. `TrackMeta` carries
 * taglines, descriptions and per-track prose that nothing here renders, and
 * importing `@/content/tracks/meta` from the client would pull the whole
 * generated manifest along with it.
 *
 * So the page projects the curriculum down to the fields the charts actually
 * read, on the server, and sends those.
 */

export interface DashboardLesson {
  slug: string;
  /** Shown only for the one lesson picked out as "next unfinished". */
  title: string;
  estimatedMinutes: number;
}

export interface DashboardModule {
  slug: string;
  title: string;
  /**
   * Live lessons only. A preview lesson has no Mark Complete button, so it can
   * never be completed and must not sit in a denominator.
   */
  lessons: DashboardLesson[];
  /** Topics a published syllabus lists, for a module with no lessons yet. */
  plannedTopics: number;
}

export interface DashboardTrack {
  slug: string;
  title: string;
  shortTitle: string;
  accent: TrackAccent;
  mode: TrackMode;
  modules: DashboardModule[];
  /** Live lessons across the whole track. Precomputed so the client does not. */
  totalLessons: number;
  totalMinutes: number;
  liveModules: number;
  totalModules: number;
  plannedTopics: number;
}
