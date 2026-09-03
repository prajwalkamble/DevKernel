/**
 * The curriculum without the lesson bodies, and the helpers over it.
 *
 * This is the import to reach for. Everything that needs titles, counts,
 * durations, statuses or links belongs here; `@/content/tracks` is only for
 * the one place that genuinely needs a lesson's sections, which is the lesson
 * route itself.
 *
 * The split is not a micro-optimisation. `Header` sits in the root layout, so
 * importing the full tree there made every route — the playground, the
 * practice console, the visualiser — compile all 621 content files. And
 * `SidebarNav` and `CurriculumMap` are Client Components, so the full tree
 * reached the browser: every lesson's code examples, in all seven languages,
 * in the first chunk a reader downloads.
 *
 * The helper names and shapes match the ones in `./index.ts` on purpose, so a
 * consumer switches by changing the import and nothing else.
 */
import type { TrackMode } from "@/content/types";
import type { LessonMeta, ModuleMeta, TrackMeta } from "./meta-types";
import { trackMetas } from "./manifest.generated";

export type { LessonMeta, ModuleMeta, TrackMeta };

/** Every track, in display order. Modules within a track are ordered too. */
export const tracks: TrackMeta[] = trackMetas;

export function getTracksByMode(mode: TrackMode): TrackMeta[] {
  return tracks.filter((track) => track.mode === mode);
}

/** Human-readable lesson budget, e.g. "10-15 min per lesson". */
export function lessonBudgetLabel(track: TrackMeta): string {
  const [min, max] = track.lessonMinutes;
  return `${min}–${max} min per lesson`;
}

/** Where "Start learning" goes when no track has been chosen. */
export const defaultTrack: TrackMeta = tracks[0];

export function getTrackBySlug(trackSlug: string): TrackMeta | undefined {
  return tracks.find((track) => track.slug === trackSlug);
}

export function getModule(trackSlug: string, moduleSlug: string): ModuleMeta | undefined {
  return getTrackBySlug(trackSlug)?.modules.find((mod) => mod.slug === moduleSlug);
}

export function getTrackLessons(track: TrackMeta): LessonMeta[] {
  return track.modules.flatMap((mod) => mod.lessons);
}

export interface LessonRef {
  trackSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}

/** Every lesson across every track — used to pre-render the lesson routes. */
export function getAllLessonRefs(): LessonRef[] {
  return tracks.flatMap((track) =>
    track.modules.flatMap((mod) =>
      mod.lessons.map((lesson) => ({
        trackSlug: track.slug,
        moduleSlug: mod.slug,
        lessonSlug: lesson.slug,
      }))
    )
  );
}

export function getFirstLesson(track: TrackMeta): LessonMeta {
  return track.modules[0].lessons[0];
}

/* Defined in `./href`, which holds no data, so a Client Component can import a
   URL without importing the curriculum. Re-exported here so every existing
   caller keeps working unchanged. */
export { lessonHref, trackHref } from "./href";

export interface AdjacentLessons {
  previous: LessonMeta | null;
  next: LessonMeta | null;
}

/** Adjacency is within a track: the last lesson of a track has no next. */
export function getAdjacentLessons(
  trackSlug: string,
  moduleSlug: string,
  lessonSlug: string
): AdjacentLessons {
  const track = getTrackBySlug(trackSlug);
  if (!track) return { previous: null, next: null };

  const flat = getTrackLessons(track);
  const index = flat.findIndex(
    (lesson) => lesson.moduleSlug === moduleSlug && lesson.slug === lessonSlug
  );
  if (index === -1) return { previous: null, next: null };

  return {
    previous: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null,
  };
}

/**
 * For a track still being written, its topics are its planned lessons.
 *
 * A preview lesson's topics live in its `takeaways`, which the manifest
 * carries only as a count — the strings themselves are lesson content.
 */
export function getPlannedLessonCount(track: TrackMeta): number {
  return track.modules.reduce(
    (total, mod) =>
      total +
      (mod.status === "available"
        ? mod.lessons.length
        : mod.lessons.reduce((n, lesson) => n + lesson.takeawayCount, 0)),
    0
  );
}

export interface TrackStats {
  availableLessons: number;
  availableModules: number;
  totalModules: number;
  estimatedMinutes: number;
}

export function getTrackStats(track: TrackMeta): TrackStats {
  const lessons = getTrackLessons(track).filter((lesson) => lesson.status === "available");
  return {
    availableLessons: lessons.length,
    availableModules: track.modules.filter((mod) => mod.status === "available").length,
    totalModules: track.modules.length,
    estimatedMinutes: lessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0),
  };
}

/** Lessons that are live right now, across every track. */
export function getTotalLessonCount(): number {
  return tracks.reduce((total, track) => total + getTrackStats(track).availableLessons, 0);
}
