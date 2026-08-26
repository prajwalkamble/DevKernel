import { HelpCircle } from "lucide-react";
import type { InterviewQuestion } from "@/content/types";
import { ProseInline } from "./Prose";

export function InterviewQA({ questions }: { questions: InterviewQuestion[] }) {
  return (
    <div className="space-y-2">
      {questions.map((qa, i) => (
        <details
          key={i}
          className="group rounded-lg border border-border bg-surface open:bg-surface"
        >
          <summary className="flex cursor-pointer list-none items-start gap-2 px-4 py-3 text-sm font-medium text-foreground marker:content-none">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span className="min-w-0 flex-1">{qa.question}</span>
            <span className="text-muted transition-transform group-open:rotate-90">›</span>
          </summary>
          <div className="border-t border-border px-4 py-3 pl-10 text-sm leading-relaxed text-foreground/80">
            <ProseInline text={qa.answer} />
          </div>
        </details>
      ))}
    </div>
  );
}
