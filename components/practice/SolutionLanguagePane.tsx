"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { SOLUTION_LANGUAGES, SOLUTION_LANGUAGE_LABEL } from "@/lib/practiceProgress";
import { useSolutionLanguage } from "@/lib/usePracticeProgress";

/**
 * Shows one of two already-rendered code blocks.
 *
 * Both are rendered on the server — Shiki highlighting is a server concern and
 * there is no reason to ship a highlighter to the browser — and passed in here
 * as props. This component only chooses which one to mount, so switching
 * language is instant and costs no network.
 */
export function SolutionLanguagePane({ java, python }: { java: ReactNode; python: ReactNode }) {
  const { language } = useSolutionLanguage();
  return <>{language === "python" ? python : java}</>;
}

/** The page-level switch. Every pane on the page follows it. */
export function SolutionLanguageTabs({ className }: { className?: string }) {
  const { language, setLanguage } = useSolutionLanguage();

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5",
        className
      )}
      role="group"
      aria-label="Solution language"
    >
      {SOLUTION_LANGUAGES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLanguage(option)}
          aria-pressed={language === option}
          className={clsx(
            "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
            language === option
              ? "bg-accent text-accent-foreground"
              : "text-muted hover:bg-surface-hover hover:text-foreground"
          )}
        >
          {SOLUTION_LANGUAGE_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
