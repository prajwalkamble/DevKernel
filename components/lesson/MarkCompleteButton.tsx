"use client";

import { Check } from "lucide-react";
import { useProgress } from "@/lib/useProgress";

export function MarkCompleteButton({
  trackSlug,
  moduleSlug,
  lessonSlug,
}: {
  trackSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}) {
  const { isComplete, toggle } = useProgress();
  const complete = isComplete(trackSlug, moduleSlug, lessonSlug);

  return (
    <button
      type="button"
      onClick={() => toggle(trackSlug, moduleSlug, lessonSlug, !complete)}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
        complete
          ? "border-success/30 bg-success/10 text-success"
          : "border-border text-foreground hover:bg-surface-hover"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
          complete ? "border-success bg-success text-background" : "border-muted"
        }`}
      >
        {complete && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      {complete ? "Completed" : "Mark as complete"}
    </button>
  );
}
