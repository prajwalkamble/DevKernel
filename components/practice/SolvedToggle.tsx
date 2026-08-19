"use client";

import { Check } from "lucide-react";
import clsx from "clsx";
import { useSolvedProblems } from "@/lib/usePracticeProgress";

export function SolvedToggle({ slug }: { slug: string }) {
  const { isSolved, toggle } = useSolvedProblems();
  const solved = isSolved(slug);

  return (
    <button
      type="button"
      onClick={() => toggle(slug, !solved)}
      aria-pressed={solved}
      className={clsx(
        "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
        solved
          ? "border-success/40 bg-success/10 text-success"
          : "border-border bg-surface text-foreground hover:bg-surface-hover"
      )}
    >
      <span
        className={clsx(
          "flex h-4 w-4 items-center justify-center rounded-full border",
          solved ? "border-success bg-success text-background" : "border-muted/50"
        )}
      >
        {solved && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </span>
      {solved ? "Solved" : "Mark as solved"}
    </button>
  );
}
