import clsx from "clsx";
import { Clock, HardDrive } from "lucide-react";
import type { Approach, ApproachTier } from "@/content/practice";
import { CodeBlock } from "@/components/lesson/CodeBlock";
import { Prose, ProseInline } from "@/components/lesson/Prose";
import { SolutionLanguagePane } from "./SolutionLanguagePane";

const TIER_LABEL: Record<ApproachTier, string> = {
  "brute-force": "Brute force",
  better: "Better",
  optimal: "Optimal",
};

/**
 * Tiers are coloured on the same scale as difficulty, but inverted in meaning:
 * a brute force is the "hard" red one to leave behind and the optimal is the
 * green one to arrive at. Reusing the palette keeps the page to one colour
 * language instead of introducing a third.
 */
const TIER_BADGE_CLASS: Record<ApproachTier, string> = {
  "brute-force": "bg-hard-soft text-hard",
  better: "bg-medium-soft text-medium",
  optimal: "bg-easy-soft text-easy",
};

export function ApproachPanel({ approach, index }: { approach: Approach; index: number }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Approach {index + 1}
        </span>
        <span
          className={clsx(
            "rounded px-2 py-0.5 text-xs font-semibold",
            TIER_BADGE_CLASS[approach.tier]
          )}
        >
          {TIER_LABEL[approach.tier]}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-foreground">{approach.title}</h3>

      <div className="mt-3">
        <p className="mb-2 text-sm font-semibold text-foreground">How you get here</p>
        <Prose paragraphs={approach.intuition} />
      </div>

      {approach.walkthrough && approach.walkthrough.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-background p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">
            What you&apos;d say before writing any code
          </p>
          <ol className="space-y-1.5 text-sm text-foreground/85">
            {approach.walkthrough.map((step, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="shrink-0 font-mono text-xs text-muted">{i + 1}.</span>
                <span>
                  <ProseInline text={step} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        <span className="flex items-center gap-1.5 text-muted">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium text-foreground">Time</span>
          <ProseInline text={approach.time} />
        </span>
        <span className="flex items-center gap-1.5 text-muted">
          <HardDrive className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium text-foreground">Space</span>
          <ProseInline text={approach.space} />
        </span>
      </div>

      <div className="mt-4">
        <SolutionLanguagePane
          java={<CodeBlock code={approach.java} language="java" />}
          python={<CodeBlock code={approach.python} language="python" />}
        />
      </div>

      <p className="mt-4 rounded-lg border-l-2 border-accent bg-accent-soft/40 px-4 py-3 text-sm leading-relaxed text-foreground/85">
        <ProseInline text={approach.verdict} />
      </p>
    </section>
  );
}
