"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, ChevronRight, CircleAlert, Copy, Loader2, X } from "lucide-react";
import type { Judge } from "@/content/practice";
import { formatCaseInputs, formatValue, truncate } from "@/lib/judge/format";
import type { CaseResult, RunOutcome } from "@/lib/judge/types";
import type { JudgePhase } from "@/lib/judge/useJudge";

/**
 * The verdict.
 *
 * Two rules shape this panel. Cases the statement already shows you are listed
 * with their inputs before you run, because a test you cannot see is not a test
 * you can think about. Hidden cases stay hidden while they pass and open up the
 * moment they fail — a failure you cannot reproduce is not feedback, it is just
 * a red mark.
 */
export function SolveResults({
  judge,
  outcome,
  phase,
  onSolved,
  solved,
  onCopyHarness,
  harnessCopied,
}: {
  judge: Judge;
  outcome: RunOutcome | null;
  phase: JudgePhase;
  onSolved: () => void;
  solved: boolean;
  /**
   * An escape hatch for the one verdict that is this site's fault rather than
   * yours: offered only when a run reports `unsupported`, so it is a recovery
   * rather than a permanent second-class path.
   */
  onCopyHarness?: () => void;
  harnessCopied?: boolean;
}) {
  if (phase === "booting") {
    return (
      <Placeholder>
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        <span>
          Starting Python. It is the real CPython interpreter compiled to WebAssembly, so the
          first run downloads it — after that, runs are instant.
        </span>
      </Placeholder>
    );
  }

  if (phase === "running") {
    return (
      <Placeholder>
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        <span>Running {judge.cases.length} cases…</span>
      </Placeholder>
    );
  }

  if (!outcome) {
    return <CasePreview judge={judge} />;
  }

  const passed = outcome.cases.filter((result) => result.status === "pass").length;

  return (
    <div className="space-y-3 p-4">
      <Verdict
        outcome={outcome}
        judge={judge}
        passed={passed}
        onSolved={onSolved}
        solved={solved}
        onCopyHarness={onCopyHarness}
        harnessCopied={harnessCopied}
      />

      {outcome.cases.length > 0 && (
        <ul className="space-y-1.5">
          {outcome.cases.map((result) => (
            <CaseRow key={result.index} judge={judge} result={result} />
          ))}
        </ul>
      )}

      {outcome.stdout.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Printed output
          </p>
          <pre className="scrollbar-thin max-h-48 overflow-auto rounded-lg bg-console p-3 font-mono text-xs whitespace-pre-wrap text-[var(--console-fg)]">
            {outcome.stdout.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-start gap-2.5 p-4 text-sm leading-relaxed text-muted">
      {children}
    </div>
  );
}

/** What you get before the first run: the examples, as cases, so they read as a checklist. */
function CasePreview({ judge }: { judge: Judge }) {
  const visible = judge.cases.filter((testCase) => testCase.visible);
  const hidden = judge.cases.length - visible.length;

  return (
    <div className="space-y-3 p-4 text-sm">
      <p className="leading-relaxed text-muted">
        Write the function, then run it. {judge.cases.length} cases are waiting —{" "}
        {visible.length} from the examples above and {hidden} you cannot see, which is the
        point: passing the examples is not the same as being right.
      </p>
      <ul className="space-y-1.5">
        {visible.map((testCase, i) => (
          <li
            key={i}
            className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground/80"
          >
            <span className="text-muted">in </span>
            {truncate(formatCaseInputs(judge, testCase.args))}
            <span className="text-muted"> → </span>
            {truncate(formatValue(testCase.expected), 60)}
          </li>
        ))}
        {hidden > 0 && (
          <li className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted">
            + {hidden} hidden case{hidden === 1 ? "" : "s"}, revealed only if you fail one
          </li>
        )}
      </ul>
    </div>
  );
}

function Verdict({
  outcome,
  judge,
  passed,
  onSolved,
  solved,
  onCopyHarness,
  harnessCopied,
}: {
  outcome: RunOutcome;
  judge: Judge;
  passed: number;
  onSolved: () => void;
  solved: boolean;
  onCopyHarness?: () => void;
  harnessCopied?: boolean;
}) {
  if (outcome.status === "passed") {
    return (
      <div className="rounded-lg border border-success/30 bg-success-soft p-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-success">
          <Check className="h-4 w-4 shrink-0" strokeWidth={3} />
          All {judge.cases.length} cases passed in {outcome.durationMs} ms
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
          Now read the approaches below and check two things: whether yours is the optimal one,
          and whether you can state its complexity without counting loops.
        </p>
        {!solved && (
          <button
            type="button"
            onClick={onSolved}
            className="mt-2.5 rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          >
            Mark it solved
          </button>
        )}
      </div>
    );
  }

  const tone =
    outcome.status === "failed"
      ? { border: "border-hard/30", bg: "bg-hard-soft", text: "text-hard" }
      : { border: "border-medium/30", bg: "bg-medium-soft", text: "text-medium" };

  const headline =
    outcome.status === "failed"
      ? `${passed} of ${judge.cases.length} cases passed`
      : STATUS_HEADLINE[outcome.status];

  return (
    <div className={clsx("rounded-lg border p-3", tone.border, tone.bg)}>
      <p className={clsx("flex items-center gap-2 text-sm font-semibold", tone.text)}>
        <CircleAlert className="h-4 w-4 shrink-0" />
        {headline}
      </p>
      {outcome.message && (
        <pre className="mt-1.5 overflow-x-auto font-mono text-xs whitespace-pre-wrap text-foreground/80">
          {outcome.message}
        </pre>
      )}
      {/* Said plainly, because the distinction matters: this verdict is not a
          statement about the solution. */}
      {outcome.status === "unsupported" && (
        <div className="mt-2 space-y-2">
          <p className="text-xs leading-relaxed text-foreground/75">
            This is a gap in the browser runtime, not a fault in your solution — so nothing
            here says your answer is wrong. Rewriting around it will work, and so will
            switching language.
          </p>
          {onCopyHarness && (
            <button
              type="button"
              onClick={onCopyHarness}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-hover"
            >
              {harnessCopied ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {harnessCopied ? "Copied" : "Copy a runnable Main.java"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_HEADLINE: Record<string, string> = {
  unsupported: "This runtime does not cover that yet",
  "no-entry": "That function is not there",
  "compile-error": "The file did not load",
  "runtime-error": "The runtime stopped",
  timeout: "Still running",
  cancelled: "Stopped",
};

function CaseRow({ judge, result }: { judge: Judge; result: CaseResult }) {
  const testCase = judge.cases[result.index];
  const hidden = !testCase.visible;
  // A hidden case that passed stays hidden; one that failed opens by default,
  // because the input is the only thing that makes the failure actionable.
  const [open, setOpen] = useState(result.status !== "pass");
  const showable = !hidden || result.status !== "pass";

  const icon =
    result.status === "pass" ? (
      <Check className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={3} />
    ) : result.status === "fail" ? (
      <X className="h-3.5 w-3.5 shrink-0 text-hard" strokeWidth={3} />
    ) : (
      <CircleAlert className="h-3.5 w-3.5 shrink-0 text-medium" />
    );

  return (
    <li
      className={clsx(
        "rounded-lg border text-sm",
        result.status === "pass" ? "border-border bg-surface" : "border-hard/25 bg-hard-soft/40"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!showable}
        aria-expanded={showable ? open : undefined}
        className="flex w-full items-center gap-2 px-3 py-2 text-left disabled:cursor-default"
      >
        {icon}
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/80">
          {hidden && result.status === "pass"
            ? `Hidden case ${result.index + 1}`
            : truncate(formatCaseInputs(judge, testCase.args), 70)}
        </span>
        {showable && (
          <ChevronRight
            className={clsx("h-3.5 w-3.5 shrink-0 text-muted transition-transform", open && "rotate-90")}
          />
        )}
      </button>

      {showable && open && (
        <dl className="space-y-1 border-t border-border/60 px-3 py-2 font-mono text-xs">
          <Field label="input" value={formatCaseInputs(judge, testCase.args)} />
          {result.status === "error" ? (
            <Field label="threw" value={result.error ?? ""} tone="bad" wrap />
          ) : (
            <>
              <Field label="expected" value={formatValue(testCase.expected)} />
              <Field
                label="got"
                value={formatValue(result.received)}
                tone={result.status === "fail" ? "bad" : undefined}
              />
            </>
          )}
          {testCase.note && result.status !== "pass" && (
            <p className="pt-1 font-sans text-xs leading-relaxed text-muted">
              This case checks: {testCase.note}
            </p>
          )}
        </dl>
      )}
    </li>
  );
}

function Field({
  label,
  value,
  tone,
  wrap,
}: {
  label: string;
  value: string;
  tone?: "bad";
  wrap?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 text-muted">{label}</dt>
      <dd
        className={clsx(
          "min-w-0 flex-1",
          wrap ? "whitespace-pre-wrap" : "overflow-x-auto",
          tone === "bad" ? "text-hard" : "text-foreground/85"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
