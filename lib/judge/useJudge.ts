"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Judge } from "@/content/practice";
import { JudgeRunner, type JudgePhase, type RunListener } from "./runner";
import type { PracticeLanguage, RunOutcome } from "./types";

export type { JudgePhase };

/**
 * The React face of `JudgeRunner`: phase and outcome as state, everything else
 * delegated. The workers themselves live in the runner and are kept between
 * runs — Python costs several seconds and a download to start, and paying that
 * on every Run would ruin the fast edit-and-rerun loop practice depends on.
 */
export function useJudge(judge: Judge | undefined) {
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [phase, setPhase] = useState<JudgePhase>("idle");
  const [runner] = useState(() => new JudgeRunner());

  useEffect(() => () => runner.dispose(), [runner]);

  const listener: RunListener = useMemo(
    () => ({ onPhase: setPhase, onOutcome: setOutcome }),
    []
  );

  const run = useCallback(
    (language: PracticeLanguage, source: string) => {
      if (!judge) return;
      setOutcome(null);
      void runner.run(judge, language, source, listener);
    },
    [judge, runner, listener]
  );

  const stop = useCallback(() => runner.stop(listener), [runner, listener]);
  const reset = useCallback(() => setOutcome(null), []);

  return { outcome, phase, run, stop, reset };
}
