/**
 * Which problems you have solved, and which language you read solutions in.
 *
 * Deliberately the same shape as lib/progress.ts — a localStorage key, a custom
 * event so several components on one page stay in step, and a `storage`
 * listener so two tabs do too. Kept separate from lesson progress because the
 * two are different things: a lesson is read once, a problem is worth re-solving
 * a month later, and conflating them would make "reset" ambiguous.
 */

const SOLVED_KEY = "devkernel:solved-problems";
const LANGUAGE_KEY = "devkernel:solution-language";

export const PRACTICE_EVENT = "devkernel:practice-changed";

export type SolutionLanguage = "java" | "python";

export const SOLUTION_LANGUAGES: SolutionLanguage[] = ["java", "python"];

export const SOLUTION_LANGUAGE_LABEL: Record<SolutionLanguage, string> = {
  java: "Java",
  python: "Python",
};

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PRACTICE_EVENT));
}

export function getSolvedProblems(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SOLVED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function setProblemSolved(slug: string, solved: boolean) {
  if (typeof window === "undefined") return;
  const current = getSolvedProblems();
  if (solved) {
    current.add(slug);
  } else {
    current.delete(slug);
  }
  window.localStorage.setItem(SOLVED_KEY, JSON.stringify([...current]));
  notify();
}

/**
 * Defaults to Java rather than to whichever is first alphabetically: it is the
 * language the interview loops in this track's target companies are conducted
 * in most often, and the one whose verbosity makes the data structures visible.
 */
export function getSolutionLanguage(): SolutionLanguage {
  if (typeof window === "undefined") return "java";
  const stored = window.localStorage.getItem(LANGUAGE_KEY);
  return stored === "python" ? "python" : "java";
}

export function setSolutionLanguage(language: SolutionLanguage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_KEY, language);
  notify();
}
