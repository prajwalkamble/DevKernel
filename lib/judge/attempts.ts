/**
 * Keeping what you wrote.
 *
 * A practice console that loses your half-finished solution on a refresh is one
 * you stop trusting with anything longer than five lines. Drafts are stored per
 * problem *and* per language, so switching the dropdown to check how the same
 * idea reads in Python does not throw away the Java you had going.
 *
 * localStorage rather than a server for the same reason lesson progress uses
 * it: there are no accounts, and an attempt is worth nothing to anyone else.
 */

import type { PracticeLanguage } from "./types";

const ATTEMPT_PREFIX = "devkernel:attempt";
const LANGUAGE_KEY = "devkernel:practice-language";

const VALID_LANGUAGES: PracticeLanguage[] = ["python", "javascript", "typescript", "java"];

function attemptKey(slug: string, language: PracticeLanguage): string {
  return `${ATTEMPT_PREFIX}:${slug}:${language}`;
}

export function loadAttempt(slug: string, language: PracticeLanguage): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(attemptKey(slug, language));
  } catch {
    return null;
  }
}

export function saveAttempt(slug: string, language: PracticeLanguage, code: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(attemptKey(slug, language), code);
  } catch {
    // A full or disabled store is not worth interrupting a solve over.
  }
}

export function clearAttempt(slug: string, language: PracticeLanguage) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(attemptKey(slug, language));
  } catch {
    // Same.
  }
}

/**
 * Which language the console opens in. Separate from the language the *solutions*
 * are read in: plenty of people read Java because that is what their interviews
 * are in, and reach for Python when they want to get an idea working quickly.
 */
export function loadPracticeLanguage(): PracticeLanguage {
  if (typeof window === "undefined") return "python";
  const stored = window.localStorage.getItem(LANGUAGE_KEY) as PracticeLanguage | null;
  return stored && VALID_LANGUAGES.includes(stored) ? stored : "python";
}

export function savePracticeLanguage(language: PracticeLanguage) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Same.
  }
}
