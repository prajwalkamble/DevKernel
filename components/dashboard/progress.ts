import type { DashboardLesson, DashboardModule, DashboardTrack } from "./types";

export interface ModuleProgress {
  mod: DashboardModule;
  done: number;
  total: number;
  minutesDone: number;
  minutesTotal: number;
}

export interface TrackProgress {
  track: DashboardTrack;
  done: number;
  minutesDone: number;
  modules: ModuleProgress[];
  /** Modules with at least one lesson completed. */
  modulesTouched: number;
  /** Modules whose every live lesson is complete. */
  modulesFinished: number;
  /** The first live lesson not marked complete, in curriculum order. */
  next: { moduleSlug: string; lesson: DashboardLesson } | null;
}

/**
 * Reads progress by walking the curriculum, never by walking the stored set.
 *
 * The direction matters. localStorage holds whatever keys were written, and a
 * lesson renamed or removed since leaves one behind that matches nothing.
 * Counting the stored set would let those inflate a total past its own
 * denominator; asking each real lesson whether it is complete cannot.
 */
export function readTracks(
  tracks: DashboardTrack[],
  completed: Set<string>
): TrackProgress[] {
  return tracks.map((track) => {
    let done = 0;
    let minutesDone = 0;
    let modulesTouched = 0;
    let modulesFinished = 0;
    let next: TrackProgress["next"] = null;

    const modules = track.modules.map((mod) => {
      let moduleDone = 0;
      let moduleMinutes = 0;
      let moduleTotalMinutes = 0;
      for (const lesson of mod.lessons) {
        moduleTotalMinutes += lesson.estimatedMinutes;
        if (completed.has(`${track.slug}/${mod.slug}/${lesson.slug}`)) {
          moduleDone++;
          moduleMinutes += lesson.estimatedMinutes;
        } else if (next === null) {
          next = { moduleSlug: mod.slug, lesson };
        }
      }
      done += moduleDone;
      minutesDone += moduleMinutes;
      if (moduleDone > 0) modulesTouched++;
      if (mod.lessons.length > 0 && moduleDone === mod.lessons.length) modulesFinished++;
      return {
        mod,
        done: moduleDone,
        total: mod.lessons.length,
        minutesDone: moduleMinutes,
        minutesTotal: moduleTotalMinutes,
      };
    });

    return { track, done, minutesDone, modules, modulesTouched, modulesFinished, next };
  });
}

/** How stale keys are counted, and the only place the stored set is walked. */
export function countStale(tracks: DashboardTrack[], completed: Set<string>): number {
  const real = new Set<string>();
  for (const track of tracks) {
    for (const mod of track.modules) {
      for (const lesson of mod.lessons) {
        real.add(`${track.slug}/${mod.slug}/${lesson.slug}`);
      }
    }
  }
  let stale = 0;
  for (const key of completed) if (!real.has(key)) stale++;
  return stale;
}

export interface Totals {
  lessons: number;
  minutes: number;
  done: number;
  minutesDone: number;
  modulesTouched: number;
  modulesFinished: number;
  liveModules: number;
}

export function totalsOf(tracks: DashboardTrack[], entries: TrackProgress[]): Totals {
  return {
    lessons: tracks.reduce((sum, t) => sum + t.totalLessons, 0),
    minutes: tracks.reduce((sum, t) => sum + t.totalMinutes, 0),
    liveModules: tracks.reduce((sum, t) => sum + t.liveModules, 0),
    done: entries.reduce((sum, e) => sum + e.done, 0),
    minutesDone: entries.reduce((sum, e) => sum + e.minutesDone, 0),
    modulesTouched: entries.reduce((sum, e) => sum + e.modulesTouched, 0),
    modulesFinished: entries.reduce((sum, e) => sum + e.modulesFinished, 0),
  };
}

/**
 * Most progress first, ties broken by curriculum order.
 *
 * The tie-break matters: without it two tracks sitting at the same fraction
 * swap places whenever the array is rebuilt, and a list that reshuffles while
 * you read it looks broken.
 */
export function byProgress(tracks: DashboardTrack[]) {
  return (a: TrackProgress, b: TrackProgress) =>
    b.done / b.track.totalLessons - a.done / a.track.totalLessons ||
    b.done - a.done ||
    tracks.indexOf(a.track) - tracks.indexOf(b.track);
}
