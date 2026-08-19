import type { Lesson, Module, Track, TrackDefinition, TrackMode } from "@/content/types";
import { dsaTrack } from "./dsa";
import { systemDesignTrack } from "./system-design";
import { jsTsTrack } from "./js-ts";
import { reactTrack } from "./react";
import { nextTrack } from "./next";
import { angularTrack } from "./angular";
import { rustTrack } from "./rust";
import { goTrack } from "./go";
import { assemblyTrack } from "./assembly";
import { cppTrack } from "./cpp";
import { javaTrack } from "./java";
import { springBootTrack } from "./spring-boot";

/** Stamps the owning track onto each module so lookups never need both halves. */
function toTrack(definition: TrackDefinition): Track {
  return {
    ...definition,
    modules: definition.modules
      .map((mod) => ({ ...mod, trackSlug: definition.slug }))
      .sort((a, b) => a.order - b.order),
  };
}

export const tracks: Track[] = [
  dsaTrack,
  systemDesignTrack,
  jsTsTrack,
  reactTrack,
  nextTrack,
  angularTrack,
  rustTrack,
  goTrack,
  assemblyTrack,
  cppTrack,
  javaTrack,
  springBootTrack,
]
  .map(toTrack)
  .sort((a, b) => a.order - b.order);

export function getTracksByMode(mode: TrackMode): Track[] {
  return tracks.filter((track) => track.mode === mode);
}

/** Human-readable lesson budget, e.g. "10-15 min per lesson". */
export function lessonBudgetLabel(track: Track): string {
  const [min, max] = track.lessonMinutes;
  return `${min}\u2013${max} min per lesson`;
}

/** Where "Start learning" goes when no track has been chosen. */
export const defaultTrack: Track = tracks[0];

export function getTrackBySlug(trackSlug: string): Track | undefined {
  return tracks.find((track) => track.slug === trackSlug);
}

export function getModule(trackSlug: string, moduleSlug: string): Module | undefined {
  return getTrackBySlug(trackSlug)?.modules.find((mod) => mod.slug === moduleSlug);
}

export function getLesson(
  trackSlug: string,
  moduleSlug: string,
  lessonSlug: string
): Lesson | undefined {
  return getModule(trackSlug, moduleSlug)?.lessons.find((lesson) => lesson.slug === lessonSlug);
}

export function getTrackLessons(track: Track): Lesson[] {
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

export function getFirstLesson(track: Track): Lesson {
  return track.modules[0].lessons[0];
}

export function lessonHref(trackSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `/learn/${trackSlug}/${moduleSlug}/${lessonSlug}`;
}

export function trackHref(trackSlug: string): string {
  return `/curriculum/${trackSlug}`;
}

export interface AdjacentLessons {
  previous: Lesson | null;
  next: Lesson | null;
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

/** For a track still being written, its topics are its planned lessons. */
export function getPlannedLessonCount(track: Track): number {
  return track.modules.reduce(
    (total, mod) =>
      total +
      (mod.status === "available"
        ? mod.lessons.length
        : mod.lessons.reduce((n, lesson) => n + (lesson.takeaways?.length ?? 0), 0)),
    0
  );
}

export interface TrackStats {
  availableLessons: number;
  availableModules: number;
  totalModules: number;
  estimatedMinutes: number;
}

export function getTrackStats(track: Track): TrackStats {
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
