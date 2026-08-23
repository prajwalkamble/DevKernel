"use client";

import posthog from "posthog-js";

/**
 * The handful of events worth naming.
 *
 * Autocapture already records every click, and `$pageview` already records
 * which lesson was open — the path carries track, module and lesson. So
 * nothing here re-states what a pageview would say. What it adds is the things
 * a URL cannot tell you: whether a reader who opened a lesson ran anything,
 * whether a practice attempt passed or failed, and whether the language
 * dropdown is a feature people actually use.
 *
 * The map is the point. Event names and property shapes drift the moment they
 * live as string literals at each call site, and a misspelt name in PostHog is
 * a silently empty chart rather than an error.
 */
export type AnalyticsEvents = {
  /** Only when a lesson is marked done, never when the mark is taken back. */
  "lesson completed": { track: string; module: string; lesson: string };
  /** The DSA track's one-algorithm-seven-languages dropdown. */
  "example language changed": { from: string; to: string };
  "playground run": { language: string };
  "practice run": {
    problem: string;
    language: string;
    /** `passed`, `failed`, `compile-error`, `timeout`, … */
    status: string;
    durationMs: number;
  };
  "visualization played": { title: string; frames: number };
};

/**
 * Sends one named event, or does nothing at all when analytics is switched off.
 *
 * The guard is what lets call sites stay unconditional. With no key in the
 * environment `posthog.init` never ran, and every `capture` would otherwise
 * spend its time logging a warning about it.
 */
export function track<K extends keyof AnalyticsEvents>(
  event: K,
  properties: AnalyticsEvents[K]
): void {
  if (!posthog.__loaded) return;
  posthog.capture(event, properties);
}
