"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getCompletedLessonKeys,
  setLessonComplete,
  PROGRESS_EVENT,
} from "@/lib/progress";

export function useProgress() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  /**
   * Whether the first read of localStorage has happened.
   *
   * Progress lives in a store the server cannot see, so the first render has
   * to be the empty set on both sides or hydration mismatches. Everything that
   * only *shades* a value can ignore this; anything that would otherwise show
   * "you have completed nothing" for one paint before the real number arrives
   * should wait on it.
   */
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setCompleted(getCompletedLessonKeys());
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Reads localStorage (an external system) into React state on mount,
    // then subscribes to further external changes — the sanctioned effect
    // pattern for syncing with a source React doesn't own.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const toggle = useCallback(
    (trackSlug: string, moduleSlug: string, lessonSlug: string, complete: boolean) => {
      setLessonComplete(trackSlug, moduleSlug, lessonSlug, complete);
    },
    []
  );

  const isComplete = useCallback(
    (trackSlug: string, moduleSlug: string, lessonSlug: string) =>
      completed.has(`${trackSlug}/${moduleSlug}/${lessonSlug}`),
    [completed]
  );

  /** How many of this track's completed lessons are in local storage. */
  const completedInTrack = useCallback(
    (trackSlug: string) => {
      let count = 0;
      for (const key of completed) if (key.startsWith(`${trackSlug}/`)) count++;
      return count;
    },
    [completed]
  );

  return { completed, hydrated, isComplete, toggle, completedInTrack };
}
