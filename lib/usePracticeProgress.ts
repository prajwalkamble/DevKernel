"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getSolutionLanguage,
  getSolvedProblems,
  PRACTICE_EVENT,
  setProblemSolved,
  setSolutionLanguage,
  type SolutionLanguage,
} from "@/lib/practiceProgress";

export function useSolvedProblems() {
  const [solved, setSolved] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => setSolved(getSolvedProblems()), []);

  useEffect(() => {
    // Same pattern as useProgress: localStorage is an external store, so the
    // first read belongs in an effect, and the listeners keep other tabs and
    // sibling components in step.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    window.addEventListener(PRACTICE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PRACTICE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const isSolved = useCallback((slug: string) => solved.has(slug), [solved]);

  const toggle = useCallback((slug: string, value: boolean) => {
    setProblemSolved(slug, value);
  }, []);

  return { solved, isSolved, toggle };
}

/**
 * The chosen solution language, shared across every code block on the page and
 * remembered between visits. Starts at the server-rendered default and corrects
 * itself on mount, so the markup React produces on the server and on the first
 * client render match.
 */
export function useSolutionLanguage() {
  const [language, setLanguageState] = useState<SolutionLanguage>("java");

  const refresh = useCallback(() => setLanguageState(getSolutionLanguage()), []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    window.addEventListener(PRACTICE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PRACTICE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const setLanguage = useCallback((next: SolutionLanguage) => {
    setSolutionLanguage(next);
  }, []);

  return { language, setLanguage };
}
