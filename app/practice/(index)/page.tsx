import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { ProblemBrowser } from "@/components/practice/ProblemBrowser";
import { getPracticeStats, PROBLEMS, toSummary } from "@/content/practice";

export const metadata: Metadata = {
  title: "The Sheet — DevKernel",
  description:
    "Every problem with a brute-force and an optimal solution in Java and Python, filterable by difficulty, pattern, topic and company.",
};

export default function PracticePage() {
  const stats = getPracticeStats();
  const summaries = PROBLEMS.map(toSummary);

  return (
    <div className="page-shell px-5 py-10 sm:px-6">
      {/* The header earns four lines and no more. Everything a returning visitor
          wants is the list itself, so the reasoning behind the sheet moves into a
          disclosure rather than standing between them and the first problem. */}
      <div className="mb-6">
        <span className="inline-block rounded bg-dsa-soft px-2 py-0.5 text-xs font-semibold text-dsa">
          The Sheet
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Problems
        </h1>
        <p className="mt-1 text-base text-muted sm:text-lg">
          Read the signals, solve it in the browser, then compare against brute force and optimal.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
          <span>
            <strong className="font-semibold text-foreground">{stats.total}</strong> problems
          </span>
          <span aria-hidden>·</span>
          <span>
            {stats.byDifficulty.easy} easy, {stats.byDifficulty.medium} medium,{" "}
            {stats.byDifficulty.hard} hard
          </span>
          <span aria-hidden>·</span>
          <span>{stats.patternsCovered} patterns</span>
        </div>

        <details className="group mt-3 text-sm">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-medium text-accent transition-opacity hover:opacity-80">
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
            How to use this sheet
          </summary>
          <div className="mt-3 max-w-2xl space-y-3 leading-relaxed text-pretty text-foreground/80">
            <p>
              Each problem opens with the{" "}
              <strong className="font-semibold text-foreground">signals</strong> — what in the
              statement and the constraints tells you which pattern this is — before any code
              appears. That is deliberate. The skill worth building is not recalling a solution; it
              is reading a problem you have never seen and knowing, within a minute, which structure
              and which algorithm it wants.
            </p>
            <p>
              Then write it yourself in the console on the problem page and run it against the tests
              before you open the solutions. Work down the list in order, or filter it to drill one
              pattern until it is automatic.
            </p>
            <Link
              href="/curriculum/dsa"
              className="inline-flex items-center gap-2 font-medium text-accent transition-opacity hover:opacity-80"
            >
              See how the sheet fits into the DSA track
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </details>
      </div>

      <ProblemBrowser problems={summaries} />
    </div>
  );
}
