"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EXAMPLE_LANGUAGE_EVENT,
  getExampleLanguage,
  setExampleLanguage,
  type ExampleLanguage,
} from "./exampleLanguage";

/**
 * The chosen example language, or null until the first read completes.
 *
 * Null is the honest initial value rather than a default, because the server
 * rendered the example's own primary language and pretending otherwise on the
 * first client render would be a hydration mismatch. Callers treat null as
 * "use the primary".
 */
export function useExampleLanguage() {
  const [language, setLanguageState] = useState<ExampleLanguage | null>(null);

  const refresh = useCallback(() => setLanguageState(getExampleLanguage()), []);

  useEffect(() => {
    // localStorage is an external store, so the first read belongs in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    window.addEventListener(EXAMPLE_LANGUAGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EXAMPLE_LANGUAGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const setLanguage = useCallback((next: ExampleLanguage) => {
    setExampleLanguage(next);
  }, []);

  return { language, setLanguage };
}
