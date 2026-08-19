const STORAGE_KEY = "devkernel:completed-lessons";
/** Previous brand. Same format as the current key, so it migrates verbatim. */
const RENAMED_STORAGE_KEY = "engineershub:completed-lessons";
/** Pre-track key, whose entries were all JS/TS and had no track segment. */
const LEGACY_STORAGE_KEY = "jsts-mastery:completed-lessons";
const LEGACY_TRACK_SLUG = "js-ts";

function lessonKey(trackSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `${trackSlug}/${moduleSlug}/${lessonSlug}`;
}

function readCompleted(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);

    // One-time migration, newest old key first. The rename carried no format
    // change, so those entries move across as they are.
    const renamed = window.localStorage.getItem(RENAMED_STORAGE_KEY);
    if (renamed) {
      const carried = new Set(JSON.parse(renamed) as string[]);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...carried]));
      return carried;
    }

    // Two-segment keys predate tracks and were all JS/TS.
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return new Set();
    const migrated = new Set(
      (JSON.parse(legacy) as string[]).map((key) => `${LEGACY_TRACK_SLUG}/${key}`)
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...migrated]));
    return migrated;
  } catch {
    return new Set();
  }
}

function writeCompleted(completed: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
}

export function isLessonComplete(
  trackSlug: string,
  moduleSlug: string,
  lessonSlug: string
): boolean {
  return readCompleted().has(lessonKey(trackSlug, moduleSlug, lessonSlug));
}

export function setLessonComplete(
  trackSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  complete: boolean
) {
  const completed = readCompleted();
  const key = lessonKey(trackSlug, moduleSlug, lessonSlug);
  if (complete) {
    completed.add(key);
  } else {
    completed.delete(key);
  }
  writeCompleted(completed);
}

export function getCompletedLessonKeys(): Set<string> {
  return readCompleted();
}

export function getCompletedCount(
  trackSlug: string,
  moduleSlug: string,
  lessonSlugs: string[]
): number {
  const completed = readCompleted();
  return lessonSlugs.filter((slug) => completed.has(lessonKey(trackSlug, moduleSlug, slug))).length;
}

export const PROGRESS_EVENT = "devkernel:progress-changed";
