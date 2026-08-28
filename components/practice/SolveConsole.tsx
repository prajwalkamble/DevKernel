"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { ChevronDown, Play, RotateCcw, Square } from "lucide-react";
import type { Judge } from "@/content/practice";
import {
  loadAttempt,
  loadPracticeLanguage,
  saveAttempt,
  savePracticeLanguage,
} from "@/lib/judge/attempts";
import { buildJavaHarness } from "@/lib/judge/javaHarness";
import {
  buildStub,
  LANGUAGE_PROFILES,
  PRACTICE_LANGUAGE_ORDER,
} from "@/lib/judge/languages";
import type { PracticeLanguage } from "@/lib/judge/types";
import { track } from "@/lib/analytics";
import { useJudge } from "@/lib/judge/useJudge";
import { useSolvedProblems } from "@/lib/usePracticeProgress";
import { SolveResults } from "./SolveResults";
import { SplitHandle } from "./SplitHandle";
import { useSplit } from "./useSplit";

const SolveEditor = dynamic(() => import("./SolveEditor").then((mod) => mod.SolveEditor), {
  ssr: false,
  loading: () => (
    <div role="status" aria-busy="true" className="h-full space-y-2.5 p-4">
      <span className="sr-only">Loading editor</span>
      {["w-2/5", "w-4/5", "w-3/5", "w-1/3", "w-5/6", "w-1/2"].map((width, i) => (
        <div key={i} className={`skeleton h-3.5 rounded-md ${width}`} aria-hidden />
      ))}
    </div>
  ),
});

/**
 * Write the solution here, before reading anyone else's.
 *
 * The console sits above the approaches on purpose. A problem you have not
 * attempted teaches you nothing when you read its answer — you recognise the
 * solution, feel that you understood it, and cannot reproduce it a week later.
 * Attempting first is what turns the approaches below from an explanation into
 * a comparison.
 */
export function SolveConsole({
  slug,
  title,
  judge,
}: {
  slug: string;
  title: string;
  judge: Judge;
}) {
  const [language, setLanguage] = useState<PracticeLanguage>("python");
  const [drafts, setDrafts] = useState<Partial<Record<PracticeLanguage, string>>>({});
  const [copied, setCopied] = useState(false);
  const { outcome, phase, run, stop, reset } = useJudge(judge);
  const { containerRef, percent, dragging, handleProps } = useSplit({
    axis: "y",
    storageKey: "devkernel:solve-split-y",
    initial: 58,
    min: 25,
    max: 80,
    label: "Resize the editor and results panes",
  });
  const { isSolved, toggle } = useSolvedProblems();

  const stubs = useMemo(
    () =>
      Object.fromEntries(
        PRACTICE_LANGUAGE_ORDER.map((id) => [id, buildStub(judge, id)])
      ) as Record<PracticeLanguage, string>,
    [judge]
  );

  useEffect(() => {
    // localStorage is an external store, so the first read belongs in an effect
    // — the server has no idea which language you last used or what you wrote.
    const stored = loadPracticeLanguage();
    const restored = Object.fromEntries(
      PRACTICE_LANGUAGE_ORDER.map((id) => [id, loadAttempt(slug, id)]).filter(
        ([, code]) => code !== null
      )
    ) as Partial<Record<PracticeLanguage, string>>;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguage(stored);
    setDrafts(restored);
  }, [slug]);

  const profile = LANGUAGE_PROFILES[language];
  const code = drafts[language] ?? stubs[language];
  const busy = phase !== "idle";

  const handleChange = useCallback(
    (next: string) => {
      setDrafts((previous) => ({ ...previous, [language]: next }));
      saveAttempt(slug, language, next);
    },
    [language, slug]
  );

  const handleLanguage = useCallback(
    (next: PracticeLanguage) => {
      setLanguage(next);
      savePracticeLanguage(next);
      reset();
      setCopied(false);
    },
    [reset]
  );

  const handleReset = useCallback(() => {
    setDrafts((previous) => ({ ...previous, [language]: stubs[language] }));
    saveAttempt(slug, language, stubs[language]);
    reset();
  }, [language, slug, stubs, reset]);

  const handleRun = useCallback(() => {
    void run(language, code);
  }, [run, language, code]);

  // Reported from the outcome, not from the Run button: the verdict is the
  // interesting half, and it does not exist yet when the button is pressed.
  // `reset()` sets the outcome back to null between runs, so each finished run
  // is one event.
  useEffect(() => {
    if (!outcome) return;
    track("practice run", {
      problem: slug,
      language,
      status: outcome.status,
      durationMs: outcome.durationMs,
    });
    // `language` is deliberately absent: it is read at report time, and adding
    // it would re-fire the event when someone switches language after a run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome, slug]);

  const handleCopyJava = useCallback(async () => {
    await navigator.clipboard.writeText(buildJavaHarness(judge, title, code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [judge, title, code]);

  return (
    <div
      ref={containerRef}
      style={{ "--split-y": `${percent}%` } as CSSProperties}
      className={clsx(
        "flex min-h-0 flex-1 flex-col",
        dragging && "cursor-row-resize select-none"
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
        <label className="relative flex items-center">
          <span className="sr-only">Language to practise in</span>
          <select
            value={language}
            onChange={(event) => handleLanguage(event.target.value as PracticeLanguage)}
            className="cursor-pointer appearance-none rounded-lg border border-border bg-background py-1.5 pr-8 pl-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
          >
            {PRACTICE_LANGUAGE_ORDER.map((id) => (
              <option key={id} value={id}>
                {LANGUAGE_PROFILES[id].label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-muted" />
        </label>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground sm:px-3"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {busy ? (
            <button
              type="button"
              onClick={stop}
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-danger px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:px-4"
            >
              <Square className="h-3.5 w-3.5" />
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRun}
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 sm:px-4"
            >
              <Play className="h-3.5 w-3.5" />
              Run tests
            </button>
          )}
        </div>
      </div>

      <p className="shrink-0 border-b border-border bg-surface px-3 py-1.5 text-xs leading-relaxed text-muted">
        {profile.runtimeNote}
      </p>

      {/* A fixed height on a phone, where the page scrolls; a share of the pane
          from `lg` up, where it does not. */}
      <div className="h-[22rem] min-h-0 shrink-0 lg:h-[var(--split-y)]">
        <SolveEditor language={language} value={code} onChange={handleChange} />
      </div>

      <SplitHandle handleProps={handleProps} dragging={dragging} axis="y" className="hidden lg:block" />

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto border-t border-border lg:border-t-0">
        <SolveResults
          judge={judge}
          outcome={outcome}
          phase={phase}
          solved={isSolved(slug)}
          onSolved={() => toggle(slug, true)}
          onCopyHarness={language === "java" ? handleCopyJava : undefined}
          harnessCopied={copied}
        />
      </div>
    </div>
  );
}
